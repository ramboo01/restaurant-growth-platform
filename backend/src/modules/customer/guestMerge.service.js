const { getDatabasePool } = require('../../config/database');

/**
 * Calculate Levenshtein Distance similarity ratio (0.0 to 1.0)
 */
function calculateNameSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  const s1 = str1.trim().toLowerCase();
  const s2 = str2.trim().toLowerCase();
  if (s1 === s2) return 1.0;

  const len1 = s1.length;
  const len2 = s2.length;
  const matrix = Array.from({ length: len1 + 1 }, () => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return Math.max(0, 1 - distance / maxLen);
}

/**
 * Compute Identity Match Confidence Score between two guest profiles
 */
function calculateMatchConfidence(custA, custB) {
  // Deterministic check
  if (
    (custA.phone && custB.phone && custA.phone.trim() === custB.phone.trim()) ||
    (custA.email && custB.email && custA.email.trim().toLowerCase() === custB.email.trim().toLowerCase())
  ) {
    return { score: 1.0, isDeterministic: true, reasons: ['Exact Phone/Email Match'] };
  }

  const nameSim = calculateNameSimilarity(custA.customer_name || custA.name, custB.customer_name || custB.name);
  const cardMatch = (custA.card_hash && custB.card_hash && custA.card_hash === custB.card_hash) ? 1.0 : 0.0;
  const deviceMatch = (custA.device_fingerprint && custB.device_fingerprint && custA.device_fingerprint === custB.device_fingerprint) ? 1.0 : 0.0;

  const score = (nameSim * 0.30) + (cardMatch * 0.40) + (deviceMatch * 0.30);
  const reasons = [];
  if (nameSim > 0.7) reasons.push(`Name similarity: ${(nameSim * 100).toFixed(0)}%`);
  if (cardMatch === 1.0) reasons.push('Payment Card Hash Match');
  if (deviceMatch === 1.0) reasons.push('Device Fingerprint Match');

  return {
    score: Number(score.toFixed(2)),
    isDeterministic: false,
    reasons,
    cardMatch: cardMatch === 1.0,
    deviceMatch: deviceMatch === 1.0,
    nameSim: Number(nameSim.toFixed(2))
  };
}

/**
 * Evaluate new or updated guest profile against existing customer graph
 */
async function evaluateGuestIdentityOnIngest(restaurantId, incomingCustomer) {
  const pool = getDatabasePool();
  const [existingList] = await pool.execute(
    `SELECT id, name, email, phone, card_hash, device_fingerprint, total_orders, total_spent 
     FROM customers 
     WHERE restaurant_id = ? AND id != ?`,
    [restaurantId, incomingCustomer.id || 0]
  );

  let bestMatch = null;
  let highestScore = 0;

  for (const existing of existingList) {
    const match = calculateMatchConfidence(incomingCustomer, existing);
    if (match.score > highestScore) {
      highestScore = match.score;
      bestMatch = { existing, match };
    }
  }

  if (!bestMatch || highestScore < 0.50) {
    return { status: 'NO_MATCH', highestScore };
  }

  const { existing, match } = bestMatch;

  // Auto-Merge Gate (>= 85% Confidence)
  if (highestScore >= 0.85) {
    console.log(`[Guest Graph] Auto-Merging Guest #${incomingCustomer.id} into Primary #${existing.id} (Score: ${(highestScore * 100).toFixed(0)}%)`);
    const mergeResult = await executeProfileMerge(
      existing.id,
      incomingCustomer.id,
      highestScore,
      'SYSTEM_AUTO_85',
      'Probabilistic identity auto-merge (Score >= 85%)'
    );
    return { status: 'AUTO_MERGED', primaryId: existing.id, score: highestScore, mergeResult };
  }

  // Admin Review Queue Gate (50% <= Score < 85%)
  if (highestScore >= 0.50) {
    console.log(`[Guest Graph] Queued Guest Match (#${incomingCustomer.id} & #${existing.id}) for Admin Review (Score: ${(highestScore * 100).toFixed(0)}%)`);
    
    // Check if candidate pair already queued
    const [existingCandidates] = await pool.execute(
      `SELECT id FROM guest_merge_candidates 
       WHERE restaurant_id = ? AND candidate_customer_id = ? AND existing_customer_id = ? AND status = 'PENDING_ADMIN_REVIEW'`,
      [restaurantId, incomingCustomer.id, existing.id]
    );

    if (existingCandidates.length === 0) {
      await pool.execute(
        `INSERT INTO guest_merge_candidates
          (restaurant_id, candidate_customer_id, existing_customer_id, confidence_score, match_reasons, card_hash_match, device_fingerprint_match, name_similarity, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_ADMIN_REVIEW')`,
        [
          restaurantId,
          incomingCustomer.id,
          existing.id,
          highestScore,
          match.reasons.join(', '),
          match.cardMatch ? 1 : 0,
          match.deviceMatch ? 1 : 0,
          match.nameSim
        ]
      );
    }
    return { status: 'QUEUED_FOR_ADMIN_REVIEW', candidateId: incomingCustomer.id, existingId: existing.id, score: highestScore };
  }

  return { status: 'NO_MATCH', highestScore };
}

/**
 * Execute atomic profile merge in database
 */
async function executeProfileMerge(primaryId, secondaryId, score, mergedBy = 'ADMIN_MANUAL', reasonCode = 'Manual merge') {
  const pool = getDatabasePool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Fetch secondary customer snapshot
    const [secRows] = await conn.execute(`SELECT * FROM customers WHERE id = ? LIMIT 1`, [secondaryId]);
    if (secRows.length === 0) throw new Error(`Secondary customer #${secondaryId} not found`);
    const secCust = secRows[0];

    const [priRows] = await conn.execute(`SELECT * FROM customers WHERE id = ? LIMIT 1`, [primaryId]);
    if (priRows.length === 0) throw new Error(`Primary customer #${primaryId} not found`);
    const priCust = priRows[0];

    // 2. Snapshot secondary profile for 30-day revertability
    await conn.execute(
      `INSERT INTO guest_merge_history
        (restaurant_id, primary_customer_id, secondary_customer_id, secondary_customer_snapshot, confidence_score, merged_by, reason_code, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
      [priCust.restaurant_id, primaryId, secondaryId, JSON.stringify(secCust), score, mergedBy, reasonCode]
    );

    // 3. Update orders to reference primary customer's phone/name
    await conn.execute(
      `UPDATE orders SET customer_phone = ?, customer_name = ? WHERE customer_phone = ?`,
      [priCust.phone, priCust.name || priCust.customer_name, secCust.phone]
    );

    // 4. Combine order counts and spend
    const newOrders = Number(priCust.total_orders || 0) + Number(secCust.total_orders || 0);
    const newSpend = Number(priCust.total_spent || priCust.total_spend || 0) + Number(secCust.total_spent || secCust.total_spend || 0);

    await conn.execute(
      `UPDATE customers SET total_orders = ?, total_spent = ? WHERE id = ?`,
      [newOrders, newSpend, primaryId]
    );

    // 5. Remove secondary customer record
    await conn.execute(`DELETE FROM customers WHERE id = ?`, [secondaryId]);

    await conn.commit();
    console.log(`[Guest Graph] Profile Merge SUCCESS: Merged #${secondaryId} into #${primaryId}. Reversible for 30 days.`);
    return { success: true, primaryId, secondaryId, mergedBy };
  } catch (err) {
    await conn.rollback();
    console.error('[Guest Graph] Profile Merge Failed:', err.message);
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Revert a profile merge within 30 days
 */
async function revertProfileMerge(historyId, revertReason = 'Admin reverted merge') {
  const pool = getDatabasePool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [rows] = await conn.execute(
      `SELECT * FROM guest_merge_history WHERE id = ? AND status = 'ACTIVE' LIMIT 1`,
      [historyId]
    );
    if (rows.length === 0) throw new Error('Active merge history record not found or already reverted');
    
    const record = rows[0];
    const secSnapshot = JSON.parse(record.secondary_customer_snapshot);

    // Re-insert secondary customer profile
    await conn.execute(
      `INSERT INTO customers (id, restaurant_id, name, email, phone, total_orders, total_spent, segment, card_hash, device_fingerprint, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        secSnapshot.id,
        secSnapshot.restaurant_id,
        secSnapshot.name || secSnapshot.customer_name,
        secSnapshot.email,
        secSnapshot.phone,
        secSnapshot.total_orders || 0,
        secSnapshot.total_spent || secSnapshot.total_spend || 0,
        secSnapshot.segment || secSnapshot.rfm_segment || 'New',
        secSnapshot.card_hash || null,
        secSnapshot.device_fingerprint || null,
        secSnapshot.created_at || new Date()
      ]
    );

    // Update status to REVERTED
    await conn.execute(
      `UPDATE guest_merge_history SET status = 'REVERTED', reverted_at = NOW(), revert_reason = ? WHERE id = ?`,
      [revertReason, historyId]
    );

    await conn.commit();
    console.log(`[Guest Graph] Reverted merge #${historyId}. Secondary profile #${secSnapshot.id} restored.`);
    return { success: true, restoredId: secSnapshot.id };
  } catch (err) {
    await conn.rollback();
    console.error('[Guest Graph] Merge Revert Failed:', err.message);
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Get pending merge review candidates for Platform Admin
 */
async function getPendingMergeCandidates(restaurantId = null) {
  const pool = getDatabasePool();
  let sql = `
    SELECT 
      c.id, c.restaurant_id AS restaurantId, c.confidence_score AS confidenceScore,
      c.match_reasons AS matchReasons, c.status, c.created_at AS createdAt,
      cand.id AS candidateId, cand.name AS candidateName, cand.email AS candidateEmail, cand.phone AS candidatePhone, cand.total_orders AS candidateOrders, cand.total_spent AS candidateSpend,
      exist.id AS existingId, exist.name AS existingName, exist.email AS existingEmail, exist.phone AS existingPhone, exist.total_orders AS existingOrders, exist.total_spent AS existingSpend
    FROM guest_merge_candidates c
    JOIN customers cand ON c.candidate_customer_id = cand.id
    JOIN customers exist ON c.existing_customer_id = exist.id
    WHERE c.status = 'PENDING_ADMIN_REVIEW'
  `;
  const params = [];

  if (restaurantId) {
    sql += ` AND c.restaurant_id = ?`;
    params.push(restaurantId);
  }

  sql += ` ORDER BY c.confidence_score DESC`;

  const [rows] = await pool.execute(sql, params);
  return rows;
}

/**
 * Admin action on merge candidate (APPROVE or REJECT)
 */
async function reviewMergeCandidate(candidateId, action, reviewNote = '', reviewerUserId = 1) {
  const pool = getDatabasePool();
  const [rows] = await pool.execute(
    `SELECT * FROM guest_merge_candidates WHERE id = ? AND status = 'PENDING_ADMIN_REVIEW' LIMIT 1`,
    [candidateId]
  );
  if (rows.length === 0) throw new Error('Pending merge candidate record not found');

  const candidate = rows[0];

  if (action === 'APPROVE') {
    await executeProfileMerge(
      candidate.existing_customer_id,
      candidate.candidate_customer_id,
      candidate.confidence_score,
      'ADMIN_MANUAL',
      reviewNote || 'Approved via Admin Guest Merge Queue'
    );
    await pool.execute(
      `UPDATE guest_merge_candidates SET status = 'APPROVED', review_note = ?, reviewed_by_user_id = ? WHERE id = ?`,
      [reviewNote, reviewerUserId, candidateId]
    );
    return { success: true, action: 'APPROVED' };
  } else {
    await pool.execute(
      `UPDATE guest_merge_candidates SET status = 'REJECTED', review_note = ?, reviewed_by_user_id = ? WHERE id = ?`,
      [reviewNote, reviewerUserId, candidateId]
    );
    return { success: true, action: 'REJECTED' };
  }
}

/**
 * Get 30-day merge history
 */
async function getMergeHistory(restaurantId = null) {
  const pool = getDatabasePool();
  let sql = `SELECT id, restaurant_id AS restaurantId, primary_customer_id AS primaryCustomerId, secondary_customer_id AS secondaryCustomerId, confidence_score AS confidenceScore, merged_by AS mergedBy, reason_code AS reasonCode, status, merged_at AS mergedAt FROM guest_merge_history`;
  const params = [];

  if (restaurantId) {
    sql += ` WHERE restaurant_id = ?`;
    params.push(restaurantId);
  }

  sql += ` ORDER BY id DESC LIMIT 50`;
  const [rows] = await pool.execute(sql, params);
  return rows;
}

module.exports = {
  calculateMatchConfidence,
  evaluateGuestIdentityOnIngest,
  executeProfileMerge,
  revertProfileMerge,
  getPendingMergeCandidates,
  reviewMergeCandidate,
  getMergeHistory
};
