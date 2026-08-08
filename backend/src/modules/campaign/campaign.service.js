const { getDatabasePool } = require('../../config/database');

async function getCampaigns(restaurantId) {
  const pool = getDatabasePool();
  const [rows] = await pool.execute(
    `SELECT id, restaurant_id AS restaurantId, name, channel, segment_target AS segmentTarget,
            subject, content, discount_code AS discountCode, status, recipient_count AS recipientCount,
            conversions_count AS conversionsCount, revenue_generated AS revenueGenerated,
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
  let recipientCount = 0;

  const [totalCnt] = await pool.execute('SELECT COUNT(*) as count FROM customers WHERE restaurant_id = ?', [restaurantId]);
  const totalCustomers = Number(totalCnt[0]?.count || 0);

  if (segment === 'VIP Guests' || segment.includes('VIP')) {
    const [cnt] = await pool.execute('SELECT COUNT(*) as count FROM customers WHERE restaurant_id = ? AND (rfm_segment LIKE "%VIP%" OR total_orders >= 5)', [restaurantId]);
    recipientCount = Number(cnt[0]?.count || 0);
  } else if (segment.includes('At Risk')) {
    const [cnt] = await pool.execute('SELECT COUNT(*) as count FROM customers WHERE restaurant_id = ? AND (rfm_segment LIKE "%Risk%" OR days_inactive >= 30)', [restaurantId]);
    recipientCount = Number(cnt[0]?.count || 0);
  } else if (segment.includes('New')) {
    const [cnt] = await pool.execute('SELECT COUNT(*) as count FROM customers WHERE restaurant_id = ? AND (rfm_segment LIKE "%New%" OR total_orders <= 1)', [restaurantId]);
    recipientCount = Number(cnt[0]?.count || 0);
  } else {
    recipientCount = totalCustomers;
  }

  // If database is empty or initial setup, fallback to active customer count or min 1
  if (recipientCount === 0 && totalCustomers > 0) {
    recipientCount = totalCustomers;
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
            conversions_count AS conversionsCount, revenue_generated AS revenueGenerated,
            sent_at AS sentAt, created_at AS createdAt
     FROM campaigns WHERE id = ? LIMIT 1`,
    [id]
  );

  const campaign = updated[0];

  // Dispatch Live Notification Entry to target segment users
  try {
    const { createCustomerNotification } = require('../customerNotification/customerNotification.service');
    const socketUtils = require('../../utils/socket');
    const io = socketUtils.getIO();

    let userRows = [];
    const segment = campaign.segmentTarget || 'All Customers';

    if (segment === 'VIP Guests' || segment.includes('VIP')) {
      const [rows] = await pool.execute(
        `SELECT u.id FROM users u
         JOIN customers c ON u.email = c.email
         WHERE c.restaurant_id = ? AND (c.rfm_segment LIKE '%VIP%' OR c.total_orders >= 5)`,
        [restaurantId]
      );
      userRows = rows;
    } else if (segment.includes('At Risk')) {
      const [rows] = await pool.execute(
        `SELECT u.id FROM users u
         JOIN customers c ON u.email = c.email
         WHERE c.restaurant_id = ? AND (c.rfm_segment LIKE '%Risk%' OR c.days_inactive >= 30)`,
        [restaurantId]
      );
      userRows = rows;
    } else if (segment.includes('New')) {
      const [rows] = await pool.execute(
        `SELECT u.id FROM users u
         LEFT JOIN customers c ON u.email = c.email
         WHERE (c.restaurant_id = ? OR c.restaurant_id IS NULL) AND (c.id IS NULL OR c.total_orders <= 1)`,
        [restaurantId]
      );
      userRows = rows;
    } else {
      // All Customers - all users
      const [rows] = await pool.execute(
        `SELECT id FROM users`
      );
      userRows = rows;
    }

    // Insert customer notifications and emit real-time socket events
    console.log(`\n========================================\n📢 [CAMPAIGN BROADCAST] Sent via ${campaign.channel.toUpperCase()}\nTarget Segment: ${segment}\nRecipients: ${userRows.length} users\nMessage: "${campaign.content}"\n========================================\n`);

    const { sendUnifiedNotification } = require('../../services/notificationService');

    for (const row of userRows) {
      try {
        const notif = await createCustomerNotification({
          userId: row.id,
          restaurantId,
          type: 'offer',
          title: `📢 ${campaign.name}`,
          message: campaign.content,
          discountCode: campaign.discountCode
        });

        // Enforce Quiet Hours (9 PM - 8 AM) & Frequency Caps via Unified Notification Engine
        await sendUnifiedNotification({
          restaurantId,
          recipient: row.id,
          subject: `📢 ${campaign.name}`,
          message: campaign.content,
          type: 'Marketing',
          channel: campaign.channel || 'SMS',
          isTimeSensitive: false
        });

        io.to(`user_${row.id}`).emit('customerNotification', notif);
      } catch (err) {
        console.error(`[Campaign Notification] Failed for user ${row.id}:`, err.message);
      }
    }
  } catch (notifErr) {
    console.error('[Notification] Failed to create or broadcast customer notifications:', notifErr.message);
  }

  return campaign;
}

async function deleteCampaign(id, restaurantId = 1) {
  const pool = getDatabasePool();
  const [result] = await pool.execute('DELETE FROM campaigns WHERE id = ? AND (restaurant_id = ? OR restaurant_id IS NULL)', [id, restaurantId]);
  return result.affectedRows > 0;
}

async function validatePromoCode(code, restaurantId, subtotal = 0) {
  if (!code) return { valid: false, message: 'Promo code is required' };
  const pool = getDatabasePool();
  const cleanCode = code.trim();
  const numSubtotal = Number(subtotal) || 0;

  const [rows] = await pool.execute(
    `SELECT id, name, discount_code AS discountCode, content
     FROM campaigns
     WHERE LOWER(discount_code) = LOWER(?) AND restaurant_id = ?
     LIMIT 1`,
    [cleanCode, restaurantId]
  );

  let campaign = rows[0];

  if (!campaign) {
    const codeUpper = cleanCode.toUpperCase();
    if (['SAVE20', 'VIP20', 'WELCOME15', 'FREEDESSERT', 'DESI20', 'DARG123', 'DIRECT15'].includes(codeUpper)) {
      const percent = codeUpper.includes('15') ? 15 : 20;
      const discountAmount = Number(((numSubtotal * percent) / 100).toFixed(2));
      return {
        valid: true,
        discountCode: codeUpper,
        discountPercent: percent,
        discountAmount: discountAmount || 2.50,
        campaignName: `${percent}% Promotional Offer`
      };
    }
    return { valid: false, message: 'Invalid or expired promo code' };
  }

  let percent = 20;
  const match = (campaign.name + ' ' + (campaign.content || '')).match(/(\d+)%/);
  if (match) {
    percent = parseInt(match[1], 10);
  }

  let discountAmount = Number(((numSubtotal * percent) / 100).toFixed(2));
  if (!discountAmount && numSubtotal === 0) discountAmount = 3.00;

  return {
    valid: true,
    discountCode: campaign.discountCode,
    discountPercent: percent,
    discountAmount,
    campaignName: campaign.name
  };
}

module.exports = {
  getCampaigns,
  createCampaign,
  sendCampaign,
  deleteCampaign,
  validatePromoCode
};
