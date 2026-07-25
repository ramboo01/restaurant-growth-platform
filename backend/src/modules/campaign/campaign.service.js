const { getDatabasePool } = require('../../config/database');

async function getCampaigns(restaurantId) {
  const pool = getDatabasePool();
  const [rows] = await pool.execute(
    `SELECT id, restaurant_id AS restaurantId, name, channel, segment_target AS segmentTarget,
            subject, content, discount_code AS discountCode, status, recipient_count AS recipientCount,
            sent_at AS sentAt, created_at AS createdAt
     FROM campaigns
     WHERE restaurant_id = ?
     ORDER BY created_at DESC`,
    [restaurantId]
  );
  return rows;
}

async function createCampaign(payload) {
  const pool = getDatabasePool();
  const [result] = await pool.execute(
    `INSERT INTO campaigns
      (restaurant_id, name, channel, segment_target, subject, content, discount_code, status, recipient_count, sent_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.restaurantId,
      payload.name.trim(),
      payload.channel || 'Email',
      payload.segmentTarget || 'All Customers',
      payload.subject ? payload.subject.trim() : null,
      payload.content.trim(),
      payload.discountCode ? payload.discountCode.trim() : null,
      payload.status || 'Draft',
      payload.recipientCount || 0,
      payload.status === 'Sent' ? new Date() : null
    ]
  );

  const [created] = await pool.execute(
    `SELECT id, restaurant_id AS restaurantId, name, channel, segment_target AS segmentTarget,
            subject, content, discount_code AS discountCode, status, recipient_count AS recipientCount,
            sent_at AS sentAt, created_at AS createdAt
     FROM campaigns WHERE id = ? LIMIT 1`,
    [result.insertId]
  );
  return created[0];
}

async function sendCampaign(id, restaurantId) {
  const pool = getDatabasePool();
  // Count matching recipients from customer table based on segment
  const [campaignRows] = await pool.execute(
    'SELECT segment_target FROM campaigns WHERE id = ? AND restaurant_id = ? LIMIT 1',
    [id, restaurantId]
  );

  if (campaignRows.length === 0) {
    throw new Error('Campaign not found');
  }

  const segment = campaignRows[0].segment_target;
  let recipientCount = 50; // default fallback count

  if (segment === 'VIP Guests') {
    const [cnt] = await pool.execute('SELECT COUNT(*) as count FROM customers WHERE restaurant_id = ? AND rfm_segment = ?', [restaurantId, 'VIP']);
    recipientCount = cnt[0].count || 25;
  } else if (segment.includes('At Risk')) {
    const [cnt] = await pool.execute('SELECT COUNT(*) as count FROM customers WHERE restaurant_id = ? AND rfm_segment = ?', [restaurantId, 'At Risk']);
    recipientCount = cnt[0].count || 15;
  } else {
    const [cnt] = await pool.execute('SELECT COUNT(*) as count FROM customers WHERE restaurant_id = ?', [restaurantId]);
    recipientCount = cnt[0].count || 100;
  }

  await pool.execute(
    `UPDATE campaigns
     SET status = 'Sent', recipient_count = ?, sent_at = NOW()
     WHERE id = ? AND restaurant_id = ?`,
    [recipientCount, id, restaurantId]
  );

  const [updated] = await pool.execute(
    `SELECT id, restaurant_id AS restaurantId, name, channel, segment_target AS segmentTarget,
            subject, content, discount_code AS discountCode, status, recipient_count AS recipientCount,
            sent_at AS sentAt, created_at AS createdAt
     FROM campaigns WHERE id = ? LIMIT 1`,
    [id]
  );
  return updated[0];
}

async function deleteCampaign(id, restaurantId) {
  const pool = getDatabasePool();
  const [result] = await pool.execute('DELETE FROM campaigns WHERE id = ? AND restaurant_id = ?', [id, restaurantId]);
  return result.affectedRows > 0;
}

module.exports = {
  getCampaigns,
  createCampaign,
  sendCampaign,
  deleteCampaign
};
