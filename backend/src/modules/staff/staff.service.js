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

async function clockInStaff(staffId, restaurantId) {
  const pool = getDatabasePool();
  const [active] = await pool.execute(
    'SELECT id FROM staff_attendance WHERE staff_id = ? AND status = "Active" LIMIT 1',
    [staffId]
  );
  if (active.length > 0) {
    return { error: 'Staff member is already clocked in.' };
  }

  const [result] = await pool.execute(
    'INSERT INTO staff_attendance (staff_id, restaurant_id, status) VALUES (?, ?, "Active")',
    [staffId, restaurantId]
  );

  return { id: result.insertId, staffId, restaurantId, status: 'Active', clockIn: new Date() };
}

async function clockOutStaff(staffId) {
  const pool = getDatabasePool();
  const [rows] = await pool.execute(
    'SELECT id, clock_in FROM staff_attendance WHERE staff_id = ? AND status = "Active" ORDER BY id DESC LIMIT 1',
    [staffId]
  );
  if (rows.length === 0) {
    return { error: 'No active clock-in session found for this staff member.' };
  }

  const session = rows[0];
  const clockOutTime = new Date();
  const clockInTime = new Date(session.clock_in);
  const diffHours = (clockOutTime - clockInTime) / (1000 * 60 * 60);
  const totalHours = Math.max(0.01, Number(diffHours.toFixed(2)));

  await pool.execute(
    'UPDATE staff_attendance SET clock_out = ?, total_hours = ?, status = "Completed" WHERE id = ?',
    [clockOutTime, totalHours, session.id]
  );

  return { id: session.id, staffId, clockOut: clockOutTime, totalHours, status: 'Completed' };
}

async function getAttendanceHistory(restaurantId) {
  const pool = getDatabasePool();
  const [rows] = await pool.execute(
    `SELECT a.id, a.staff_id AS staffId, s.name AS staffName, s.role, a.clock_in AS clockIn, a.clock_out AS clockOut, a.total_hours AS totalHours, a.status
     FROM staff_attendance a
     JOIN staff s ON a.staff_id = s.id
     WHERE a.restaurant_id = ?
     ORDER BY a.clock_in DESC
     LIMIT 50`,
    [restaurantId]
  );
  return rows;
}

module.exports = {
  STAFF_ROLES,
  STAFF_STATUSES,
  createStaff,
  getStaff,
  getStaffById,
  getStaffByRestaurantId,
  updateStaff,
  deleteStaff,
  clockInStaff,
  clockOutStaff,
  getAttendanceHistory
};

