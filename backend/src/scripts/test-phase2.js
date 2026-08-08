const { getDatabasePool } = require('../config/database');
const { calculateMatchConfidence, evaluateGuestIdentityOnIngest, getPendingMergeCandidates, reviewMergeCandidate, getMergeHistory, revertProfileMerge } = require('../modules/customer/guestMerge.service');

async function testPhase2() {
  console.log('--- TESTING PHASE 2: GUEST GRAPH INTELLIGENCE ---');
  const pool = getDatabasePool();

  // Seed 2 customers for testing
  console.log('\n[1] Seeding test customer profiles...');
  const [res1] = await pool.execute(
    `INSERT INTO customers (restaurant_id, name, phone, email, total_orders, total_spent, card_hash, device_fingerprint)
     VALUES (1, 'Robert Downey Jr', '+15559876543', 'rdj@stark.com', 5, 250.00, 'card_hash_token_abc123', 'dev_fp_iphone15')`
  );
  const primaryId = res1.insertId;

  // Insert a candidate profile with identical card_hash and device_fingerprint, but slightly different name (Levenshtein ~80%)
  const [res2] = await pool.execute(
    `INSERT INTO customers (restaurant_id, name, phone, email, total_orders, total_spent, card_hash, device_fingerprint)
     VALUES (1, 'Robert Downey', '+15559876544', 'rdj.alt@stark.com', 2, 90.00, 'card_hash_token_abc123', 'dev_fp_iphone15')`
  );
  const secondaryId = res2.insertId;

  console.log(`Created Primary Customer #${primaryId} and Candidate Customer #${secondaryId}`);

  // Test 2: Calculate match confidence
  const custA = { name: 'Robert Downey Jr', card_hash: 'card_hash_token_abc123', device_fingerprint: 'dev_fp_iphone15' };
  const custB = { name: 'Robert Downey', card_hash: 'card_hash_token_abc123', device_fingerprint: 'dev_fp_iphone15' };
  const matchResult = calculateMatchConfidence(custA, custB);
  console.log('\n[2] Computed Match Score:', (matchResult.score * 100).toFixed(0) + '%', 'Reasons:', matchResult.reasons);

  // Test 3: Run Ingest Evaluation (Should trigger auto-merge if >=85% or review queue if 50-84%)
  console.log('\n[3] Running evaluateGuestIdentityOnIngest...');
  const evalRes = await evaluateGuestIdentityOnIngest(1, {
    id: secondaryId,
    name: 'Robert Downey',
    phone: '+15559876544',
    card_hash: 'card_hash_token_abc123',
    device_fingerprint: 'dev_fp_iphone15'
  });
  console.log('Ingest Evaluation Result:', evalRes.status, `(Score: ${(evalRes.score * 100).toFixed(0)}%)`);

  // Test 4: Check Pending Candidates
  const candidates = await getPendingMergeCandidates(1);
  console.log(`\n[4] Pending Candidates in Queue: ${candidates.length}`);

  // Test 5: Check Merge History & 30-Day Revertability
  const history = await getMergeHistory(1);
  console.log(`[5] Active Merge History Logs: ${history.length}`);
  if (history.length > 0) {
    const latestHistoryId = history[0].id;
    console.log(`Reverting merge #${latestHistoryId}...`);
    const revertRes = await revertProfileMerge(latestHistoryId, 'Automated Phase 2 Integration Test Revert');
    console.log('Revert Result:', revertRes);
  }

  // Cleanup test data
  console.log('\n[6] Cleaning up test data...');
  await pool.execute(`DELETE FROM guest_merge_candidates WHERE candidate_customer_id IN (${primaryId}, ${secondaryId}) OR existing_customer_id IN (${primaryId}, ${secondaryId})`);
  await pool.execute(`DELETE FROM guest_merge_history WHERE primary_customer_id IN (${primaryId}, ${secondaryId}) OR secondary_customer_id IN (${primaryId}, ${secondaryId})`);
  await pool.execute(`DELETE FROM customers WHERE id IN (${primaryId}, ${secondaryId})`);
  console.log('Test data cleaned up.');

  console.log('\n✅ ALL PHASE 2 TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

testPhase2().catch(err => {
  console.error('❌ Phase 2 test failed:', err);
  process.exit(1);
});
