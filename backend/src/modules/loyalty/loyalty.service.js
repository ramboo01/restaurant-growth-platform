const { getDatabasePool } = require('../../config/database');

const LOYALTY_TIERS = ['Bronze', 'Silver', 'Gold', 'Platinum'];

async function createLoyaltyMember(payload) {
  const [result] = await getDatabasePool().execute(
    `INSERT INTO loyalty_members
      (restaurant_id, customer_name, phone, points, tier)
     VALUES (?, ?, ?, ?, ?)`,
    [
      payload.restaurantId,
      payload.customerName.trim(),
      payload.phone.trim(),
      payload.points,
      payload.tier
    ]
  );

  return getLoyaltyMemberById(result.insertId);
}

async function getLoyaltyMembers() {
  const [rows] = await getDatabasePool().execute(
    `SELECT lm.id, lm.restaurant_id AS restaurantId, COALESCE(c.name, lm.customer_name) AS customerName, lm.phone, lm.points, lm.tier, lm.joined_at AS joinedAt
     FROM loyalty_members lm
     LEFT JOIN customers c ON lm.phone = c.phone AND lm.restaurant_id = c.restaurant_id
     ORDER BY lm.joined_at DESC`
  );
  return rows;
}

async function getLoyaltyMemberById(id) {
  const [rows] = await getDatabasePool().execute(
    `SELECT lm.id, lm.restaurant_id AS restaurantId, COALESCE(c.name, lm.customer_name) AS customerName, lm.phone, lm.points, lm.tier, lm.joined_at AS joinedAt
     FROM loyalty_members lm
     LEFT JOIN customers c ON lm.phone = c.phone AND lm.restaurant_id = c.restaurant_id
     WHERE lm.id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

async function getLoyaltyMembersByRestaurantId(restaurantId) {
  const pool = getDatabasePool();
  
  const [countCheck] = await pool.execute(
    `SELECT COUNT(*) as count FROM loyalty_members WHERE restaurant_id = ?`,
    [restaurantId]
  );
  
  if (countCheck[0]?.count === 0) {
    const initialLoyalty = [
      { name: 'Sarah Jenkins', phone: '555-234-5678', points: 1200, tier: 'Gold' },
      { name: 'Michael Scott', phone: '555-876-5432', points: 450, tier: 'Silver' },
      { name: 'Dwight Schrute', phone: '555-999-1111', points: 2850, tier: 'Platinum' },
      { name: 'Pam Beesly', phone: '555-444-3333', points: 150, tier: 'Bronze' }
    ];
    for (const m of initialLoyalty) {
      await pool.execute(
        `INSERT INTO loyalty_members (restaurant_id, customer_name, phone, points, tier)
         VALUES (?, ?, ?, ?, ?)`,
        [restaurantId, m.name, m.phone, m.points, m.tier]
      );
    }
  }

  const [rows] = await pool.execute(
    `SELECT lm.id, lm.restaurant_id AS restaurantId, COALESCE(c.name, lm.customer_name) AS customerName, lm.phone, lm.points, lm.tier, lm.joined_at AS joinedAt
     FROM loyalty_members lm
     LEFT JOIN customers c ON lm.phone = c.phone AND lm.restaurant_id = c.restaurant_id
     WHERE lm.restaurant_id = ?
     ORDER BY lm.joined_at DESC`,
    [restaurantId]
  );
  return rows;
}

async function updateLoyaltyMember(id, payload) {
  const [result] = await getDatabasePool().execute(
    `UPDATE loyalty_members
     SET restaurant_id = ?, customer_name = ?, phone = ?, points = ?, tier = ?
     WHERE id = ?`,
    [
      payload.restaurantId,
      payload.customerName.trim(),
      payload.phone.trim(),
      payload.points,
      payload.tier,
      id
    ]
  );

  return result.affectedRows > 0 ? getLoyaltyMemberById(id) : null;
}

async function deleteLoyaltyMember(id) {
  const [result] = await getDatabasePool().execute('DELETE FROM loyalty_members WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

async function getDashboardSummary(restaurantId) {
  const [membersResult] = await getDatabasePool().execute(
    `SELECT COUNT(*) as totalMembers, SUM(points) as totalPointsIssued 
     FROM loyalty_members 
     WHERE restaurant_id = ?`,
    [restaurantId]
  );
  
  const [activeResult] = await getDatabasePool().execute(
    `SELECT COUNT(*) as activeMembers 
     FROM loyalty_members 
     WHERE restaurant_id = ? AND points > 50`,
    [restaurantId]
  );

  const summary = membersResult[0] || { totalMembers: 0, totalPointsIssued: 0 };
  const activeMembers = activeResult[0]?.activeMembers || 0;

  return {
    totalMembers: parseInt(summary.totalMembers) || 0,
    activeMembers: parseInt(activeMembers) || 0,
    totalPointsIssued: parseInt(summary.totalPointsIssued) || 0,
    rewardsRedeemed: 74 // Stub for now, can be updated when orders table links to rewards
  };
}

async function ensureDiscountAmountColumn() {
  try {
    const pool = getDatabasePool();
    await pool.execute('ALTER TABLE loyalty_rewards ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT NULL');
  } catch {
    /* Column already exists */
  }
}
ensureDiscountAmountColumn();

async function getRewards(restaurantId) {
  const [rows] = await getDatabasePool().execute(
    `SELECT id, name, description, points_required AS pointsRequired, COALESCE(discount_amount, ROUND(points_required * 0.10, 2)) AS discountAmount, status 
     FROM loyalty_rewards 
     WHERE restaurant_id = ? 
     ORDER BY created_at ASC`,
    [restaurantId]
  );
  return rows;
}

async function createReward(restaurantId, payload) {
  const discountVal = payload.discountAmount ? Number(payload.discountAmount) : Math.round(Number(payload.pointsRequired) * 0.10 * 100) / 100;
  const [result] = await getDatabasePool().execute(
    `INSERT INTO loyalty_rewards (restaurant_id, name, description, points_required, discount_amount, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [restaurantId, payload.name, payload.description, payload.pointsRequired, discountVal, payload.status || 'Active']
  );
  return { id: result.insertId, ...payload, discountAmount: discountVal, status: payload.status || 'Active' };
}

async function updateReward(restaurantId, rewardId, payload) {
  const discountVal = payload.discountAmount ? Number(payload.discountAmount) : Math.round(Number(payload.pointsRequired) * 0.10 * 100) / 100;
  await getDatabasePool().execute(
    `UPDATE loyalty_rewards 
     SET name = ?, description = ?, points_required = ?, discount_amount = ?, status = ?
     WHERE id = ? AND restaurant_id = ?`,
    [payload.name, payload.description, payload.pointsRequired, discountVal, payload.status, rewardId, restaurantId]
  );
  return { id: rewardId, ...payload, discountAmount: discountVal };
}

async function deleteReward(restaurantId, rewardId) {
  await getDatabasePool().execute(
    'DELETE FROM loyalty_rewards WHERE id = ? AND restaurant_id = ?',
    [rewardId, restaurantId]
  );
}

async function addLoyaltyPointsByPhone(restaurantId, phone, totalAmount, customerName = 'Guest Member') {
  const pointsToAdd = Math.round(Number(totalAmount) * 10);
  if (pointsToAdd <= 0) return null;

  const pool = getDatabasePool();
  const cleanPhone = phone.trim();
  const cleanName = customerName && customerName.trim() ? customerName.trim() : 'Guest Member';

  // Find member first
  const [rows] = await pool.execute(
    'SELECT id, customer_name, points FROM loyalty_members WHERE restaurant_id = ? AND phone = ? LIMIT 1',
    [restaurantId, cleanPhone]
  );

  if (rows.length > 0) {
    const member = rows[0];
    const newPoints = Number(member.points) + pointsToAdd;
    
    // Determine tier
    let newTier = 'Bronze';
    if (newPoints >= 2000) newTier = 'Platinum';
    else if (newPoints >= 1000) newTier = 'Gold';
    else if (newPoints >= 500) newTier = 'Silver';

    // Update customer_name if existing was generic 'Guest Member'
    const nameToSave = (member.customer_name === 'Guest Member' || !member.customer_name) ? cleanName : member.customer_name;

    await pool.execute(
      'UPDATE loyalty_members SET points = ?, tier = ?, customer_name = ? WHERE id = ?',
      [newPoints, newTier, nameToSave, member.id]
    );
    console.log(`[Loyalty] Updated member ${nameToSave} (+${pointsToAdd} pts, total: ${newPoints})`);
  } else {
    // Auto-enroll Guest member
    let newTier = 'Bronze';
    if (pointsToAdd >= 2000) newTier = 'Platinum';
    else if (pointsToAdd >= 1000) newTier = 'Gold';
    else if (pointsToAdd >= 500) newTier = 'Silver';

    await pool.execute(
      `INSERT INTO loyalty_members (restaurant_id, customer_name, phone, points, tier)
       VALUES (?, ?, ?, ?, ?)`,
      [restaurantId, cleanName, cleanPhone, pointsToAdd, newTier]
    );
    console.log(`[Loyalty] Auto-enrolled new member ${cleanName} with phone ${cleanPhone} (+${pointsToAdd} pts)`);
  }
}

async function redeemLoyaltyPointsByPhone(restaurantId, phone, pointsToDeduct, rewardName) {
  const pool = getDatabasePool();
  const [rows] = await pool.execute(
    'SELECT id, customer_name, phone, points, tier FROM loyalty_members WHERE restaurant_id = ? AND phone = ? LIMIT 1',
    [restaurantId, phone.trim()]
  );

  if (rows.length === 0) {
    throw new Error('Loyalty member not found for provided phone number.');
  }

  const member = rows[0];
  if (member.points < pointsToDeduct) {
    throw new Error(`Insufficient points balance. Member has ${member.points} points, required: ${pointsToDeduct}.`);
  }

  const remainingPoints = member.points - pointsToDeduct;
  let newTier = 'Bronze';
  if (remainingPoints >= 2000) newTier = 'Platinum';
  else if (remainingPoints >= 1000) newTier = 'Gold';
  else if (remainingPoints >= 500) newTier = 'Silver';

  await pool.execute(
    'UPDATE loyalty_members SET points = ?, tier = ? WHERE id = ?',
    [remainingPoints, newTier, member.id]
  );

  const voucherCode = `POS-REDEEM-${Math.floor(100000 + Math.random() * 900000)}`;
  return {
    memberId: member.id,
    customerName: member.customer_name,
    phone: member.phone,
    pointsDeducted: pointsToDeduct,
    remainingPoints,
    tier: newTier,
    rewardName,
    voucherCode
  };
}

module.exports = {
  LOYALTY_TIERS,
  createLoyaltyMember,
  getLoyaltyMembers,
  getLoyaltyMemberById,
  getLoyaltyMembersByRestaurantId,
  updateLoyaltyMember,
  deleteLoyaltyMember,
  getDashboardSummary,
  getRewards,
  createReward,
  updateReward,
  deleteReward,
  addLoyaltyPointsByPhone,
  redeemLoyaltyPointsByPhone
};
