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
    `SELECT id, restaurant_id AS restaurantId, customer_name AS customerName, phone, points, tier, joined_at AS joinedAt
     FROM loyalty_members
     ORDER BY joined_at DESC`
  );
  return rows;
}

async function getLoyaltyMemberById(id) {
  const [rows] = await getDatabasePool().execute(
    `SELECT id, restaurant_id AS restaurantId, customer_name AS customerName, phone, points, tier, joined_at AS joinedAt
     FROM loyalty_members
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

async function getLoyaltyMembersByRestaurantId(restaurantId) {
  const [rows] = await getDatabasePool().execute(
    `SELECT id, restaurant_id AS restaurantId, customer_name AS customerName, phone, points, tier, joined_at AS joinedAt
     FROM loyalty_members
     WHERE restaurant_id = ?
     ORDER BY joined_at DESC`,
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

async function getRewards(restaurantId) {
  const [rows] = await getDatabasePool().execute(
    `SELECT id, name, description, points_required AS pointsRequired, status 
     FROM loyalty_rewards 
     WHERE restaurant_id = ? 
     ORDER BY created_at ASC`,
    [restaurantId]
  );
  return rows;
}

async function createReward(restaurantId, payload) {
  const [result] = await getDatabasePool().execute(
    `INSERT INTO loyalty_rewards (restaurant_id, name, description, points_required, status)
     VALUES (?, ?, ?, ?, ?)`,
    [restaurantId, payload.name, payload.description, payload.pointsRequired, payload.status || 'Active']
  );
  return { id: result.insertId, ...payload, status: payload.status || 'Active' };
}

async function updateReward(restaurantId, rewardId, payload) {
  await getDatabasePool().execute(
    `UPDATE loyalty_rewards 
     SET name = ?, description = ?, points_required = ?, status = ?
     WHERE id = ? AND restaurant_id = ?`,
    [payload.name, payload.description, payload.pointsRequired, payload.status, rewardId, restaurantId]
  );
  return { id: rewardId, ...payload };
}

async function deleteReward(restaurantId, rewardId) {
  await getDatabasePool().execute(
    'DELETE FROM loyalty_rewards WHERE id = ? AND restaurant_id = ?',
    [rewardId, restaurantId]
  );
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
  deleteReward
};
