const { getDatabasePool } = require('../../config/database');
const { parseListOptions, executePaginatedQuery } = require('../../utils/pagination');

const NOTIFICATION_TYPES = ['Info', 'Warning', 'Order', 'Payment', 'System'];
const NOTIFICATION_SORT_MAP = {
  createdAt: 'created_at',
  title: 'title',
  type: 'type',
  isRead: 'is_read'
};

async function createNotification(payload) {
  const [result] = await getDatabasePool().execute(
    `INSERT INTO notifications
      (restaurant_id, user_id, title, message, type, discount_code, is_read)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.restaurantId,
      payload.userId || null,
      payload.title.trim(),
      payload.message.trim(),
      payload.type || 'CAMPAIGN',
      payload.discountCode || null,
      payload.isRead ? 1 : 0
    ]
  );

  return getNotificationById(result.insertId);
}

async function getNotifications(query = {}) {
  const pool = getDatabasePool();
  const options = parseListOptions(query, { sortMap: NOTIFICATION_SORT_MAP });
  const whereClauses = [];
  const params = [];

  if (options.search) {
    whereClauses.push('(title LIKE ? OR message LIKE ? OR type LIKE ?)');
    const pattern = `%${options.search}%`;
    params.push(pattern, pattern, pattern);
  }

  if (query.isRead !== undefined && query.isRead !== '') {
    whereClauses.push('is_read = ?');
    params.push(String(query.isRead).toLowerCase() === 'true' || String(query.isRead) === '1' ? 1 : 0);
  }

  return executePaginatedQuery({
    pool,
    selectClause: `SELECT id, restaurant_id AS restaurantId, user_id AS userId, title, message, type, discount_code AS discountCode, is_read AS isRead, created_at AS createdAt`,
    fromClause: 'FROM notifications',
    whereClauses,
    params,
    sortColumn: options.sortColumn,
    order: options.order,
    page: options.page,
    limit: options.limit,
    offset: options.offset
  });
}

async function getNotificationById(id) {
  const [rows] = await getDatabasePool().execute(
    `SELECT id, restaurant_id AS restaurantId, user_id AS userId, title, message, type, discount_code AS discountCode, is_read AS isRead, created_at AS createdAt
     FROM notifications
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

async function getNotificationsByRestaurantId(restaurantId, query = {}) {
  const pool = getDatabasePool();
  const options = parseListOptions(query, { sortMap: NOTIFICATION_SORT_MAP });
  const whereClauses = ['restaurant_id = ?'];
  const params = [restaurantId];

  if (query.userId) {
    whereClauses.push('(user_id = ? OR user_id IS NULL)');
    params.push(query.userId);
  }

  if (options.search) {
    whereClauses.push('(title LIKE ? OR message LIKE ? OR type LIKE ?)');
    const pattern = `%${options.search}%`;
    params.push(pattern, pattern, pattern);
  }

  if (query.isRead !== undefined && query.isRead !== '') {
    whereClauses.push('is_read = ?');
    params.push(String(query.isRead).toLowerCase() === 'true' || String(query.isRead) === '1' ? 1 : 0);
  }

  return executePaginatedQuery({
    pool,
    selectClause: `SELECT id, restaurant_id AS restaurantId, user_id AS userId, title, message, type, discount_code AS discountCode, is_read AS isRead, created_at AS createdAt`,
    fromClause: 'FROM notifications',
    whereClauses,
    params,
    sortColumn: options.sortColumn || 'created_at',
    order: options.order || 'DESC',
    page: options.page,
    limit: options.limit,
    offset: options.offset
  });
}

async function markNotificationAsRead(id) {
  const [result] = await getDatabasePool().execute(
    'UPDATE notifications SET is_read = 1 WHERE id = ?',
    [id]
  );
  return result.affectedRows > 0 ? getNotificationById(id) : null;
}

async function markAllNotificationsAsRead(restaurantId, userId = null) {
  const pool = getDatabasePool();
  if (userId) {
    await pool.execute(
      'UPDATE notifications SET is_read = 1 WHERE restaurant_id = ? AND (user_id = ? OR user_id IS NULL)',
      [restaurantId, userId]
    );
  } else {
    await pool.execute('UPDATE notifications SET is_read = 1 WHERE restaurant_id = ?', [restaurantId]);
  }
  return true;
}

async function deleteNotification(id) {
  const [result] = await getDatabasePool().execute('DELETE FROM notifications WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = {
  createNotification,
  getNotifications,
  getNotificationById,
  getNotificationsByRestaurantId,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
};
