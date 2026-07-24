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
  // Server-side Loyalty Reward Validation and Point Deduction
  if (payload.fulfillmentDetails && payload.fulfillmentDetails.redeemedRewardId) {
    const pool = getDatabasePool();
    const rewardId = payload.fulfillmentDetails.redeemedRewardId;
    const phone = payload.customerPhone.trim();
    const restaurantId = payload.restaurantId;

    // 1. Fetch reward points requirement
    const [rewardRows] = await pool.execute(
      'SELECT name, points_required FROM loyalty_rewards WHERE id = ? AND restaurant_id = ? LIMIT 1',
      [rewardId, restaurantId]
    );
    if (rewardRows.length === 0) {
      throw new Error('Selected loyalty reward not found or inactive.');
    }

    const reward = rewardRows[0];
    const pointsRequired = Number(reward.points_required);

    // 2. Fetch member's current points
    const [memberRows] = await pool.execute(
      'SELECT id, points, customer_name FROM loyalty_members WHERE phone = ? AND restaurant_id = ? LIMIT 1',
      [phone, restaurantId]
    );
    if (memberRows.length === 0) {
      throw new Error('No loyalty member profile found matching this phone number.');
    }

    const member = memberRows[0];
    const currentPoints = Number(member.points);
    if (currentPoints < pointsRequired) {
      throw new Error(`Insufficient loyalty points. Required: ${pointsRequired}, Available: ${currentPoints}`);
    }

    const newPoints = currentPoints - pointsRequired;
    
    // Determine tier
    let newTier = 'Bronze';
    if (newPoints >= 2000) newTier = 'Platinum';
    else if (newPoints >= 1000) newTier = 'Gold';
    else if (newPoints >= 500) newTier = 'Silver';

    // 3. Deduct points
    await pool.execute(
      'UPDATE loyalty_members SET points = ?, tier = ? WHERE id = ?',
      [newPoints, newTier, member.id]
    );
    console.log(`[Loyalty] Redeemed reward "${reward.name}" for ${member.customer_name}. Deducted ${pointsRequired} points (Remaining: ${newPoints})`);
  }

  const [result] = await getDatabasePool().execute(
    `INSERT INTO orders
      (restaurant_id, customer_name, customer_phone, order_number, total_amount, order_status, payment_status, items, fulfillment_details, special_instructions)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.restaurantId,
      payload.customerName.trim(),
      payload.customerPhone.trim(),
      payload.orderNumber.trim(),
      payload.totalAmount,
      payload.orderStatus,
      payload.paymentStatus,
      payload.items ? JSON.stringify(payload.items) : null,
      payload.fulfillmentDetails ? JSON.stringify(payload.fulfillmentDetails) : null,
      payload.specialInstructions ? payload.specialInstructions.trim() : null
    ]
  );

  const order = await getOrderById(result.insertId);

  try {
    const { createNotification } = require('../notification/notification.service');
    const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(order.totalAmount) || 0);
    await createNotification({
      restaurantId: order.restaurantId,
      title: 'New Order Received',
      message: `Order ${order.orderNumber} placed for ${formattedAmount}.`,
      type: 'Order',
      isRead: false
    });
  } catch (err) {
    console.error('[Notification] Failed to auto-create order notification:', err.message);
  }

  return order;
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
    selectClause: `SELECT id, restaurant_id AS restaurantId, customer_name AS customerName, customer_phone AS customerPhone, order_number AS orderNumber, total_amount AS totalAmount, order_status AS orderStatus, payment_status AS paymentStatus, items, fulfillment_details AS fulfillmentDetails, special_instructions AS specialInstructions, created_at AS createdAt`,
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
    `SELECT id, restaurant_id AS restaurantId, customer_name AS customerName, customer_phone AS customerPhone, order_number AS orderNumber, total_amount AS totalAmount, order_status AS orderStatus, payment_status AS paymentStatus, items, fulfillment_details AS fulfillmentDetails, special_instructions AS specialInstructions, created_at AS createdAt
     FROM orders
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

async function getOrderByNumber(orderNumber) {
  const [rows] = await getDatabasePool().execute(
    `SELECT id, restaurant_id AS restaurantId, customer_name AS customerName, customer_phone AS customerPhone, order_number AS orderNumber, total_amount AS totalAmount, order_status AS orderStatus, payment_status AS paymentStatus, items, fulfillment_details AS fulfillmentDetails, special_instructions AS specialInstructions, created_at AS createdAt
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

  if (result.affectedRows > 0) {
    const order = await getOrderById(id);
    if (order && (payload.orderStatus === 'Completed' || payload.orderStatus === 'Delivered')) {
      try {
        const { addLoyaltyPointsByPhone } = require('../loyalty/loyalty.service');
        await addLoyaltyPointsByPhone(order.restaurantId, order.customerPhone, order.totalAmount);
        const { syncCustomerOrder } = require('../customer/customer.service');
        await syncCustomerOrder(order.restaurantId, order.customerName, order.customerPhone, '', order.totalAmount, new Date());
        const { deductInventoryForOrder } = require('../inventory/inventory.service');
        await deductInventoryForOrder(order);
      } catch (err) {
        console.error('[CRM/Loyalty/Inventory] Failed to sync on update:', err.message);
      }
    }
    return order;
  }
  return null;
}

async function deleteOrder(id) {
  const [result] = await getDatabasePool().execute('DELETE FROM orders WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

async function updateOrderStatus(id, status) {
  const [result] = await getDatabasePool().execute('UPDATE orders SET order_status = ? WHERE id = ?', [status, id]);
  if (result.affectedRows > 0) {
    const order = await getOrderById(id);
    if (order && (status === 'Completed' || status === 'Delivered')) {
      try {
        const { addLoyaltyPointsByPhone } = require('../loyalty/loyalty.service');
        await addLoyaltyPointsByPhone(order.restaurantId, order.customerPhone, order.totalAmount);
        const { syncCustomerOrder } = require('../customer/customer.service');
        await syncCustomerOrder(order.restaurantId, order.customerName, order.customerPhone, '', order.totalAmount, new Date());
        const { deductInventoryForOrder } = require('../inventory/inventory.service');
        await deductInventoryForOrder(order);
      } catch (err) {
        console.error('[CRM/Loyalty/Inventory] Failed to sync on status update:', err.message);
      }
    }
    return order;
  }
  return null;
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
