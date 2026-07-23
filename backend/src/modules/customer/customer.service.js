const { getDatabasePool } = require('../../config/database');
const { parseListOptions, executePaginatedQuery } = require('../../utils/pagination');

const CUSTOMER_SORT_MAP = {
  name: 'name',
  phone: 'phone',
  totalOrders: 'total_orders',
  totalSpent: 'total_spent',
  createdAt: 'created_at',
  lastOrderAt: 'last_order_at'
};

async function createCustomer(payload) {
  const [result] = await getDatabasePool().execute(
    `INSERT INTO customers
      (restaurant_id, name, phone, email, total_orders, total_spent, last_order_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.restaurantId,
      payload.name.trim(),
      payload.phone.trim(),
      payload.email.trim(),
      payload.totalOrders,
      payload.totalSpent,
      payload.lastOrderAt ?? null
    ]
  );

  return getCustomerById(result.insertId);
}

async function getCustomers(query = {}) {
  const pool = getDatabasePool();
  const options = parseListOptions(query, { sortMap: CUSTOMER_SORT_MAP });
  const whereClauses = [];
  const params = [];

  if (options.search) {
    whereClauses.push('(name LIKE ? OR phone LIKE ? OR email LIKE ?)');
    const pattern = `%${options.search}%`;
    params.push(pattern, pattern, pattern);
  }

  if (query.phone) {
    whereClauses.push('phone LIKE ?');
    params.push(`%${query.phone}%`);
  }

  if (query.name) {
    whereClauses.push('name LIKE ?');
    params.push(`%${query.name}%`);
  }

  return executePaginatedQuery({
    pool,
    selectClause: `SELECT id, restaurant_id AS restaurantId, name, phone, email, total_orders AS totalOrders, total_spent AS totalSpent, last_order_at AS lastOrderAt, created_at AS createdAt`,
    fromClause: 'FROM customers',
    whereClauses,
    params,
    sortColumn: options.sortColumn,
    order: options.order,
    page: options.page,
    limit: options.limit,
    offset: options.offset
  });
}

async function getCustomerById(id) {
  const [rows] = await getDatabasePool().execute(
    `SELECT id, restaurant_id AS restaurantId, name, phone, email, total_orders AS totalOrders, total_spent AS totalSpent, last_order_at AS lastOrderAt, created_at AS createdAt
     FROM customers
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

async function getCustomersByRestaurantId(restaurantId, query = {}) {
  const pool = getDatabasePool();
  const options = parseListOptions(query, { sortMap: CUSTOMER_SORT_MAP });
  const whereClauses = ['restaurant_id = ?'];
  const params = [restaurantId];

  if (options.search) {
    whereClauses.push('(name LIKE ? OR phone LIKE ? OR email LIKE ?)');
    const pattern = `%${options.search}%`;
    params.push(pattern, pattern, pattern);
  }

  if (query.phone) {
    whereClauses.push('phone LIKE ?');
    params.push(`%${query.phone}%`);
  }

  if (query.name) {
    whereClauses.push('name LIKE ?');
    params.push(`%${query.name}%`);
  }

  return executePaginatedQuery({
    pool,
    selectClause: `SELECT id, restaurant_id AS restaurantId, name, phone, email, total_orders AS totalOrders, total_spent AS totalSpent, last_order_at AS lastOrderAt, created_at AS createdAt`,
    fromClause: 'FROM customers',
    whereClauses,
    params,
    sortColumn: options.sortColumn,
    order: options.order,
    page: options.page,
    limit: options.limit,
    offset: options.offset
  });
}

async function updateCustomer(id, payload) {
  const [result] = await getDatabasePool().execute(
    `UPDATE customers
     SET restaurant_id = ?, name = ?, phone = ?, email = ?, total_orders = ?, total_spent = ?, last_order_at = ?
     WHERE id = ?`,
    [
      payload.restaurantId,
      payload.name.trim(),
      payload.phone.trim(),
      payload.email.trim(),
      payload.totalOrders,
      payload.totalSpent,
      payload.lastOrderAt ?? null,
      id
    ]
  );

  return result.affectedRows > 0 ? getCustomerById(id) : null;
}

async function deleteCustomer(id) {
  const [result] = await getDatabasePool().execute('DELETE FROM customers WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById,
  getCustomersByRestaurantId,
  updateCustomer,
  deleteCustomer
};
