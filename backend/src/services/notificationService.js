const { getDatabasePool } = require('../config/database');
const smsService = require('../utils/smsService');

/**
 * Check if the given date/time falls within quiet hours (9:00 PM to 8:00 AM)
 */
function isQuietHours(date = new Date()) {
  const hours = date.getHours();
  // Quiet hours: 21:00 (9 PM) to 08:00 (8 AM)
  return hours >= 21 || hours < 8;
}

/**
 * Check if customer has reached maximum allowed marketing sends in past 24 hours
 */
async function isFrequencyCapped(customerPhoneOrEmail, maxPer24h = 2) {
  if (!customerPhoneOrEmail) return false;
  const pool = getDatabasePool();
  try {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS send_count 
       FROM notifications 
       WHERE (message LIKE ?) 
         AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
      [`%${customerPhoneOrEmail}%`]
    );
    const count = rows[0]?.send_count || 0;
    return count >= maxPer24h;
  } catch (err) {
    console.warn('[Notification Engine] Could not check frequency cap:', err.message);
    return false;
  }
}

/**
 * Main Unified Notification Engine Entry Point
 */
async function sendUnifiedNotification(payload) {
  const {
    restaurantId = 1,
    recipient,
    subject = 'Notification',
    message,
    type = 'Marketing',
    channel = 'SMS',
    isTimeSensitive = false
  } = payload;

  const pool = getDatabasePool();

  // 1. Time-Sensitive Bypass (Order status, OTP, System alerts)
  if (isTimeSensitive || type === 'Order' || type === 'System') {
    console.log(`[Unified Engine] Time-sensitive send to ${recipient} (${channel}): "${subject}"`);
    if (channel === 'SMS' || channel === 'WhatsApp') {
      await smsService.sendSMS(recipient, message);
    }
    
    // Log to DB
    await pool.execute(
      `INSERT INTO notifications (restaurant_id, title, message, type, is_read, created_at)
       VALUES (?, ?, ?, ?, 0, NOW())`,
      [restaurantId, subject, `${message} [To: ${recipient}]`, type]
    ).catch(() => {});

    return { status: 'DELIVERED', immediate: true };
  }

  // 2. Quiet Hours Guard (9 PM - 8 AM)
  if (isQuietHours()) {
    console.warn(`[Unified Engine] QUIET HOURS ACTIVE (9 PM - 8 AM). Delaying non-critical message for ${recipient}.`);
    await pool.execute(
      `INSERT INTO notifications (restaurant_id, title, message, type, is_read, created_at)
       VALUES (?, ?, ?, 'QUEUED_QUIET_HOURS', 0, NOW())`,
      [restaurantId, `[Scheduled 8AM] ${subject}`, `${message} [To: ${recipient}]`]
    ).catch(() => {});
    return { status: 'QUEUED_QUIET_HOURS', scheduledFor: '08:00 AM' };
  }

  // 3. Frequency Cap Guard (Max 2 marketing sends per 24h)
  const capped = await isFrequencyCapped(recipient, 2);
  if (capped) {
    console.warn(`[Unified Engine] FREQUENCY CAP EXCEEDED for ${recipient}. Message suppressed.`);
    await pool.execute(
      `INSERT INTO notifications (restaurant_id, title, message, type, is_read, created_at)
       VALUES (?, ?, ?, 'SUPPRESSED_FREQUENCY_CAP', 0, NOW())`,
      [restaurantId, `[Suppressed] ${subject}`, `${message} [To: ${recipient}]`]
    ).catch(() => {});
    return { status: 'SUPPRESSED_FREQUENCY_CAP', reason: 'Maximum 2 messages per 24h reached' };
  }

  // 4. Send Message Immediately
  console.log(`[Unified Engine] Sending ${channel} to ${recipient}: "${message}"`);
  if (channel === 'SMS' || channel === 'WhatsApp') {
    await smsService.sendSMS(recipient, message);
  }

  await pool.execute(
    `INSERT INTO notifications (restaurant_id, title, message, type, is_read, created_at)
     VALUES (?, ?, ?, ?, 0, NOW())`,
    [restaurantId, subject, `${message} [To: ${recipient}]`, type]
  ).catch(() => {});

  return { status: 'DELIVERED', immediate: true };
}

module.exports = {
  isQuietHours,
  isFrequencyCapped,
  sendUnifiedNotification
};
