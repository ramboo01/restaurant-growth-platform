const { getDatabasePool } = require('../../config/database');
const { parseListOptions, executePaginatedQuery } = require('../../utils/pagination');

const ORDER_STATUSES = ['Pending', 'Accepted', 'Preparing', 'Ready', 'Out for Delivery', 'Completed', 'Cancelled'];
const ORDER_SORT_MAP = {
  createdAt: 'created_at',
  totalAmount: 'total_amount',
  status: 'order_status',
  orderNumber: 'order_number',
  customerName: 'customer_name'
};

async function createOrder(payload) {
  const [result] = await getDatabasePool().execute(
    `INSERT INTO orders
      (restaurant_id, customer_name, customer_phone, order_number, total_amount, order_status, payment_status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.restaurantId,
      payload.customerName.trim(),
      payload.customerPhone.trim(),
      payload.orderNumber.trim(),
      payload.totalAmount,
      payload.orderStatus,
      payload.paymentStatus
    ]
  );

  return getOrderById(result.insertId);
}

async function getOrders(query = {}) {
  const pool = getDatabasePool();
  const options = parseListOptions(query, { sortMap: ORDER_SORT_MAP });
  const whereClauses = [];
  const params = [];

  if (options.search) {
    whereClauses.push('(customer_name LIKE ? OR customer_phone LIKE ? OR order_number LIKE ?)');
    const pattern = `%${options.search}%`;
    params.push(pattern, pattern, pattern);
  }

  if (query.restaurantId) {
    whereClauses.push('restaurant_id = ?');
    params.push(query.restaurantId);
  }

  if (query.status) {
    whereClauses.push('order_status = ?');
    params.push(query.status);
  }

  if (query.date) {
    whereClauses.push('DATE(created_at) = ?');
    params.push(query.date);
  }

  return executePaginatedQuery({
    pool,
    selectClause: `SELECT id, restaurant_id AS restaurantId, customer_name AS customerName, customer_phone AS customerPhone, order_number AS orderNumber, total_amount AS totalAmount, order_status AS orderStatus, payment_status AS paymentStatus, created_at AS createdAt`,
    fromClause: 'FROM orders',
    whereClauses,
    params,
    sortColumn: options.sortColumn,
    order: options.order,
    page: options.page,
    limit: options.limit,
    offset: options.offset
  });
}

async function getOrderById(id) {
  const [rows] = await getDatabasePool().execute(
    `SELECT id, restaurant_id AS restaurantId, customer_name AS customerName, customer_phone AS customerPhone, order_number AS orderNumber, total_amount AS totalAmount, order_status AS orderStatus, payment_status AS paymentStatus, created_at AS createdAt
     FROM orders
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

async function getOrderByNumber(orderNumber) {
  const [rows] = await getDatabasePool().execute(
    `SELECT id, restaurant_id AS restaurantId, customer_name AS customerName, customer_phone AS customerPhone, order_number AS orderNumber, total_amount AS totalAmount, order_status AS orderStatus, payment_status AS paymentStatus, created_at AS createdAt
     FROM orders
     WHERE order_number = ?
     LIMIT 1`,
    [orderNumber]
  );
  return rows[0] ?? null;
}

async function updateOrder(id, payload) {
  const [result] = await getDatabasePool().execute(
    `UPDATE orders
     SET restaurant_id = ?, customer_name = ?, customer_phone = ?, order_number = ?, total_amount = ?, order_status = ?, payment_status = ?
     WHERE id = ?`,
    [
      payload.restaurantId,
      payload.customerName.trim(),
      payload.customerPhone.trim(),
      payload.orderNumber.trim(),
      payload.totalAmount,
      payload.orderStatus,
      payload.paymentStatus,
      id
    ]
  );

  return result.affectedRows > 0 ? getOrderById(id) : null;
}

async function deleteOrder(id) {
  const [result] = await getDatabasePool().execute('DELETE FROM orders WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

async function updateOrderStatus(id, status) {
  const [result] = await getDatabasePool().execute('UPDATE orders SET order_status = ? WHERE id = ?', [status, id]);
  return result.affectedRows > 0 ? getOrderById(id) : null;
}

module.exports = {
  ORDER_STATUSES,
  createOrder,
  getOrders,
  getOrderById,
  getOrderByNumber,
  updateOrder,
  deleteOrder,
  updateOrderStatus
};
