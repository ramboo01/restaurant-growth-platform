const { getDatabasePool } = require('../../config/database');
const { parseListOptions, executePaginatedQuery } = require('../../utils/pagination');

const DRIVER_STATUSES = ['Active', 'On Delivery', 'Off Duty'];
const DRIVER_SORT_MAP = {
  name: 'name',
  status: 'status',
  phone: 'phone',
  createdAt: 'created_at'
};

async function createDriver(payload) {
  const [result] = await getDatabasePool().execute(
    `INSERT INTO drivers
      (restaurant_id, name, phone, vehicle_number, license_number, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      payload.restaurantId,
      payload.name.trim(),
      payload.phone.trim(),
      payload.vehicleNumber.trim(),
      payload.licenseNumber.trim(),
      payload.status
    ]
  );

  return getDriverById(result.insertId);
}

async function getDrivers(query = {}) {
  const pool = getDatabasePool();
  const options = parseListOptions(query, { sortMap: DRIVER_SORT_MAP });
  const whereClauses = [];
  const params = [];

  if (options.search) {
    whereClauses.push('(name LIKE ? OR phone LIKE ? OR vehicle_number LIKE ? OR license_number LIKE ?)');
    const pattern = `%${options.search}%`;
    params.push(pattern, pattern, pattern, pattern);
  }

  return executePaginatedQuery({
    pool,
    selectClause: `SELECT id, restaurant_id AS restaurantId, name, phone, vehicle_number AS vehicleNumber, license_number AS licenseNumber, status, created_at AS createdAt`,
    fromClause: 'FROM drivers',
    whereClauses,
    params,
    sortColumn: options.sortColumn,
    order: options.order,
    page: options.page,
    limit: options.limit,
    offset: options.offset
  });
}

async function getDriverById(id) {
  const [rows] = await getDatabasePool().execute(
    `SELECT id, restaurant_id AS restaurantId, name, phone, vehicle_number AS vehicleNumber, license_number AS licenseNumber, status, created_at AS createdAt
     FROM drivers
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

async function getDriversByRestaurantId(restaurantId, query = {}) {
  const pool = getDatabasePool();
  const options = parseListOptions(query, { sortMap: DRIVER_SORT_MAP });
  const whereClauses = ['restaurant_id = ?'];
  const params = [restaurantId];

  if (options.search) {
    whereClauses.push('(name LIKE ? OR phone LIKE ? OR vehicle_number LIKE ? OR license_number LIKE ?)');
    const pattern = `%${options.search}%`;
    params.push(pattern, pattern, pattern, pattern);
  }

  return executePaginatedQuery({
    pool,
    selectClause: `SELECT id, restaurant_id AS restaurantId, name, phone, vehicle_number AS vehicleNumber, license_number AS licenseNumber, status, created_at AS createdAt`,
    fromClause: 'FROM drivers',
    whereClauses,
    params,
    sortColumn: options.sortColumn,
    order: options.order,
    page: options.page,
    limit: options.limit,
    offset: options.offset
  });
}

async function updateDriver(id, payload) {
  const [result] = await getDatabasePool().execute(
    `UPDATE drivers
     SET restaurant_id = ?, name = ?, phone = ?, vehicle_number = ?, license_number = ?, status = ?
     WHERE id = ?`,
    [
      payload.restaurantId,
      payload.name.trim(),
      payload.phone.trim(),
      payload.vehicleNumber.trim(),
      payload.licenseNumber.trim(),
      payload.status,
      id
    ]
  );

  return result.affectedRows > 0 ? getDriverById(id) : null;
}

async function deleteDriver(id) {
  const [result] = await getDatabasePool().execute('DELETE FROM drivers WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = {
  DRIVER_STATUSES,
  createDriver,
  getDrivers,
  getDriverById,
  getDriversByRestaurantId,
  updateDriver,
  deleteDriver
};
