const { getDatabasePool } = require('../../config/database');

/**
 * Create a notification for a specific user
 */
async function createCustomerNotification({ userId, restaurantId, type, title, message }) {
  const pool = getDatabasePool();
  const [result] = await pool.execute(
    `INSERT INTO customer_notifications (user_id, restaurant_id, type, title, message)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, restaurantId, type, title, message]
  );
  return { id: result.insertId, userId, restaurantId, type, title, message, isRead: false, createdAt: new Date().toISOString() };
}

/**
 * Get all notifications for a user
 */
async function getCustomerNotifications(userId) {
  const pool = getDatabasePool();
  const [rows] = await pool.execute(
    `SELECT id, user_id AS userId, restaurant_id AS restaurantId, type, title, message,
            is_read AS isRead, created_at AS createdAt
     FROM customer_notifications
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 50`,
    [userId]
  );
  return rows;
}

/**
 * Mark one or all notifications as read for a user
 */
async function markNotificationsRead(userId, notificationId = null) {
  const pool = getDatabasePool();
  if (notificationId) {
    await pool.execute(
      `UPDATE customer_notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
      [notificationId, userId]
    );
  } else {
    await pool.execute(
      `UPDATE customer_notifications SET is_read = 1 WHERE user_id = ?`,
      [userId]
    );
  }
}

/**
 * Count unread notifications for a user
 */
async function countUnread(userId) {
  const pool = getDatabasePool();
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS count FROM customer_notifications WHERE user_id = ? AND is_read = 0`,
    [userId]
  );
  return rows[0]?.count || 0;
}

module.exports = {
  createCustomerNotification,
  getCustomerNotifications,
  markNotificationsRead,
  countUnread
};
