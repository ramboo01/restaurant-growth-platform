const { getDatabasePool } = require('../../config/database');
const { parseListOptions } = require('../../utils/pagination');

const CUSTOMER_SORT_MAP = {
  name: 'name',
  phone: 'phone',
  totalOrders: 'total_orders',
  totalSpent: 'total_spent',
  createdAt: 'created_at',
  lastOrderAt: 'last_order_at'
};

function calculateRFMSegment(totalOrders, totalSpent, lastOrderAt) {
  if (!lastOrderAt) return 'New';

  const lastOrderDate = new Date(lastOrderAt);
  const now = new Date();
  const diffDays = Math.floor((now - lastOrderDate) / (1000 * 60 * 60 * 24));

  if (totalOrders >= 10 || totalSpent >= 250) {
    return 'VIP';
  }
  if (diffDays > 90) {
    return 'Churned';
  }
  if (diffDays > 30) {
    return 'Lapsed';
  }
  if (totalOrders >= 2 && diffDays <= 30) {
    return 'Active';
  }
  return 'New';
}

async function recalculateAllCustomerRFMSegments() {
  const pool = getDatabasePool();
  try {
    const [rows] = await pool.execute('SELECT id, total_orders, total_spent, last_order_at FROM customers');
    for (const row of rows) {
      const segment = calculateRFMSegment(row.total_orders, Number(row.total_spent), row.last_order_at);
      await pool.execute('UPDATE customers SET segment = ? WHERE id = ?', [segment, row.id]);
    }
    console.log(`[RFM Cron] Recalculated RFM segments for ${rows.length} customers.`);
  } catch (err) {
    console.error('[RFM Cron] Failed to recalculate RFM segments:', err.message);
  }
}

// Run immediately on startup
setTimeout(recalculateAllCustomerRFMSegments, 2000);
// Run every 24 hours
setInterval(recalculateAllCustomerRFMSegments, 24 * 60 * 60 * 1000);

async function createCustomer(payload) {
  const [result] = await getDatabasePool().execute(
    `INSERT INTO customers
      (restaurant_id, name, phone, email, total_orders, total_spent, last_order_at, notes, segment)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.restaurantId,
      payload.name.trim(),
      payload.phone.trim(),
      payload.email.trim(),
      payload.totalOrders,
      payload.totalSpent,
      payload.lastOrderAt ?? null,
      payload.notes ?? null,
      payload.segment ?? 'New'
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
    whereClauses.push('(c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)');
    const pattern = `%${options.search}%`;
    params.push(pattern, pattern, pattern);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const [countResult] = await pool.execute(
    `SELECT COUNT(*) as count FROM customers c ${whereSql}`,
    params
  );
  const totalItems = countResult[0]?.count || 0;

  const [rows] = await pool.execute(
    `SELECT c.id, c.restaurant_id AS restaurantId, c.name, c.phone, c.email, c.notes, c.segment,
            c.total_orders AS totalOrders, c.total_spent AS totalSpent, c.last_order_at AS lastOrderAt, c.created_at AS createdAt,
            COALESCE(l.points, 0) AS loyaltyPoints, COALESCE(l.tier, 'Bronze') AS loyaltyTier
     FROM customers c
     LEFT JOIN loyalty_members l ON c.phone = l.phone AND c.restaurant_id = l.restaurant_id
     ${whereSql}
     ORDER BY c.${CUSTOMER_SORT_MAP[options.sortColumn] || 'created_at'} ${options.order}
     LIMIT ${options.limit} OFFSET ${options.offset}`,
    params
  );

  const mappedRows = rows.map(r => ({
    ...r,
    totalSpend: Number(r.totalSpent),
    lastVisit: r.lastOrderAt
  }));

  return {
    items: mappedRows,
    meta: {
      totalItems,
      itemCount: mappedRows.length,
      itemsPerPage: options.limit,
      totalPages: Math.ceil(totalItems / options.limit),
      currentPage: options.page
    }
  };
}

async function getCustomerById(id) {
  const [rows] = await getDatabasePool().execute(
    `SELECT c.id, c.restaurant_id AS restaurantId, c.name, c.phone, c.email, c.notes, c.segment,
            c.total_orders AS totalOrders, c.total_spent AS totalSpent, c.last_order_at AS lastOrderAt, c.created_at AS createdAt,
            COALESCE(l.points, 0) AS loyaltyPoints, COALESCE(l.tier, 'Bronze') AS loyaltyTier
     FROM customers c
     LEFT JOIN loyalty_members l ON c.phone = l.phone AND c.restaurant_id = l.restaurant_id
     WHERE c.id = ?
     LIMIT 1`,
    [id]
  );
  if (rows[0]) {
    rows[0].totalSpend = Number(rows[0].totalSpent);
    rows[0].lastVisit = rows[0].lastOrderAt;

    // Fetch actual order history for this phone number!
    const [orders] = await getDatabasePool().execute(
      `SELECT id, order_number AS orderNumber, total_amount AS totalAmount, order_status AS orderStatus, created_at AS createdAt
       FROM orders
       WHERE customer_phone = ? AND restaurant_id = ?
       ORDER BY created_at DESC`,
      [rows[0].phone, rows[0].restaurantId]
    );
    rows[0].recentOrders = orders;
  }
  return rows[0] ?? null;
}

async function getCustomersByRestaurantId(restaurantId, query = {}) {
  const pool = getDatabasePool();
  const options = parseListOptions(query, { sortMap: CUSTOMER_SORT_MAP });
  const whereClauses = ['c.restaurant_id = ?'];
  const params = [restaurantId];

  if (options.search) {
    whereClauses.push('(c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)');
    const pattern = `%${options.search}%`;
    params.push(pattern, pattern, pattern);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const [countResult] = await pool.execute(
    `SELECT COUNT(*) as count FROM customers c ${whereSql}`,
    params
  );
  const totalItems = countResult[0]?.count || 0;

  const [rows] = await pool.execute(
    `SELECT c.id, c.restaurant_id AS restaurantId, c.name, c.phone, c.email, c.notes, c.segment,
            c.total_orders AS totalOrders, c.total_spent AS totalSpent, c.last_order_at AS lastOrderAt, c.created_at AS createdAt,
            COALESCE(l.points, 0) AS loyaltyPoints, COALESCE(l.tier, 'Bronze') AS loyaltyTier
     FROM customers c
     LEFT JOIN loyalty_members l ON c.phone = l.phone AND c.restaurant_id = l.restaurant_id
     ${whereSql}
     ORDER BY c.${CUSTOMER_SORT_MAP[options.sortColumn] || 'created_at'} ${options.order}
     LIMIT ${options.limit} OFFSET ${options.offset}`,
    params
  );

  const mappedRows = rows.map(r => ({
    ...r,
    totalSpend: Number(r.totalSpent),
    lastVisit: r.lastOrderAt
  }));

  return {
    items: mappedRows,
    meta: {
      totalItems,
      itemCount: mappedRows.length,
      itemsPerPage: options.limit,
      totalPages: Math.ceil(totalItems / options.limit),
      currentPage: options.page
    }
  };
}

async function updateCustomer(id, payload) {
  const [result] = await getDatabasePool().execute(
    `UPDATE customers
     SET restaurant_id = ?, name = ?, phone = ?, email = ?, total_orders = ?, total_spent = ?, last_order_at = ?, notes = ?, segment = ?
     WHERE id = ?`,
    [
      payload.restaurantId,
      payload.name.trim(),
      payload.phone.trim(),
      payload.email.trim(),
      payload.totalOrders,
      payload.totalSpent,
      payload.lastOrderAt ?? null,
      payload.notes ?? null,
      payload.segment ?? 'New',
      id
    ]
  );

  return result.affectedRows > 0 ? getCustomerById(id) : null;
}

async function deleteCustomer(id) {
  const [result] = await getDatabasePool().execute('DELETE FROM customers WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

async function syncCustomerOrder(restaurantId, customerName, phone, email, orderAmount, orderDate) {
  const pool = getDatabasePool();
  const cleanPhone = phone.trim();
  const cleanEmail = email ? email.trim() : '';
  const dateVal = orderDate || new Date();

  // Check if customer already exists by phone
  const [rows] = await pool.execute(
    'SELECT id, total_orders, total_spent FROM customers WHERE phone = ? AND restaurant_id = ? LIMIT 1',
    [cleanPhone, restaurantId]
  );

  if (rows.length > 0) {
    const cust = rows[0];
    const nextOrders = Number(cust.total_orders) + 1;
    const nextSpent = Number(cust.total_spent) + Number(orderAmount);
    const segment = calculateRFMSegment(nextOrders, nextSpent, dateVal);

    await pool.execute(
      `UPDATE customers 
       SET name = ?, email = ?, total_orders = ?, total_spent = ?, last_order_at = ?, segment = ?
       WHERE id = ?`,
      [customerName.trim(), cleanEmail, nextOrders, nextSpent, dateVal, segment, cust.id]
    );
    console.log(`[CRM] Updated customer ${customerName} (orders: ${nextOrders}, spent: ${nextSpent}, segment: ${segment})`);
  } else {
    const segment = calculateRFMSegment(1, Number(orderAmount), dateVal);
    await pool.execute(
      `INSERT INTO customers (restaurant_id, name, phone, email, total_orders, total_spent, last_order_at, segment)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [restaurantId, customerName.trim(), cleanPhone, cleanEmail, 1, Number(orderAmount), dateVal, segment]
    );
    console.log(`[CRM] Auto-created new customer ${customerName} with phone ${cleanPhone} (segment: ${segment})`);
  }
}

module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById,
  getCustomersByRestaurantId,
  updateCustomer,
  deleteCustomer,
  syncCustomerOrder,
  recalculateAllCustomerRFMSegments
};
