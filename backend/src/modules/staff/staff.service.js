const { getDatabasePool } = require('../../config/database');
const { parseListOptions, executePaginatedQuery } = require('../../utils/pagination');

const STAFF_STATUSES = ['Active', 'On Leave'];
const STAFF_ROLES = ['Manager', 'Chef', 'Cashier', 'Waiter', 'Delivery Driver'];
const STAFF_SORT_MAP = {
  name: 'name',
  role: 'role',
  shift: 'shift',
  status: 'status',
  createdAt: 'created_at'
};

async function createStaff(payload) {
  const [result] = await getDatabasePool().execute(
    `INSERT INTO staff
      (restaurant_id, name, role, phone, email, shift, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.restaurantId,
      payload.name.trim(),
      payload.role,
      payload.phone.trim(),
      payload.email.trim(),
      payload.shift.trim(),
      payload.status
    ]
  );

  return getStaffById(result.insertId);
}

async function getStaff(query = {}) {
  const pool = getDatabasePool();
  const options = parseListOptions(query, { sortMap: STAFF_SORT_MAP });
  const whereClauses = [];
  const params = [];

  if (options.search) {
    whereClauses.push('(name LIKE ? OR role LIKE ? OR phone LIKE ? OR email LIKE ?)');
    const pattern = `%${options.search}%`;
    params.push(pattern, pattern, pattern, pattern);
  }

  return executePaginatedQuery({
    pool,
    selectClause: `SELECT id, restaurant_id AS restaurantId, name, role, phone, email, shift, status, created_at AS createdAt`,
    fromClause: 'FROM staff',
    whereClauses,
    params,
    sortColumn: options.sortColumn,
    order: options.order,
    page: options.page,
    limit: options.limit,
    offset: options.offset
  });
}

async function getStaffById(id) {
  const [rows] = await getDatabasePool().execute(
    `SELECT id, restaurant_id AS restaurantId, name, role, phone, email, shift, status, created_at AS createdAt
     FROM staff
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

async function getStaffByRestaurantId(restaurantId, query = {}) {
  const pool = getDatabasePool();
  const options = parseListOptions(query, { sortMap: STAFF_SORT_MAP });
  const whereClauses = ['restaurant_id = ?'];
  const params = [restaurantId];

  if (options.search) {
    whereClauses.push('(name LIKE ? OR role LIKE ? OR phone LIKE ? OR email LIKE ?)');
    const pattern = `%${options.search}%`;
    params.push(pattern, pattern, pattern, pattern);
  }

  return executePaginatedQuery({
    pool,
    selectClause: `SELECT id, restaurant_id AS restaurantId, name, role, phone, email, shift, status, created_at AS createdAt`,
    fromClause: 'FROM staff',
    whereClauses,
    params,
    sortColumn: options.sortColumn,
    order: options.order,
    page: options.page,
    limit: options.limit,
    offset: options.offset
  });
}

async function updateStaff(id, payload) {
  const [result] = await getDatabasePool().execute(
    `UPDATE staff
     SET restaurant_id = ?, name = ?, role = ?, phone = ?, email = ?, shift = ?, status = ?
     WHERE id = ?`,
    [
      payload.restaurantId,
      payload.name.trim(),
      payload.role,
      payload.phone.trim(),
      payload.email.trim(),
      payload.shift.trim(),
      payload.status,
      id
    ]
  );

  return result.affectedRows > 0 ? getStaffById(id) : null;
}

async function deleteStaff(id) {
  const [result] = await getDatabasePool().execute('DELETE FROM staff WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = {
  STAFF_ROLES,
  STAFF_STATUSES,
  createStaff,
  getStaff,
  getStaffById,
  getStaffByRestaurantId,
  updateStaff,
  deleteStaff
};
