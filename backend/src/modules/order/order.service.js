const { getDatabasePool } = require('../../config/database');
const { parseListOptions, executePaginatedQuery } = require('../../utils/pagination');

const ORDER_STATUSES = ['Pending', 'Accepted', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered', 'Completed', 'Cancelled'];
const ORDER_SORT_MAP = {
  createdAt: 'created_at',
  totalAmount: 'total_amount',
  status: 'order_status',
  orderNumber: 'order_number',
  customerName: 'customer_name'
};

async function createOrder(payload) {
  const pool = getDatabasePool();

  // Server-side Delivery Minimum Order Value Guard
  const fulfillmentType = payload.fulfillmentDetails?.type || 'Pickup';
  if (fulfillmentType === 'Delivery') {
    try {
      const [delConfigRows] = await pool.execute(
        'SELECT min_order_value FROM delivery_configs WHERE restaurant_id = ? LIMIT 1',
        [payload.restaurantId]
      );
      if (delConfigRows.length > 0 && delConfigRows[0].min_order_value) {
        const minVal = Number(delConfigRows[0].min_order_value);
        if (minVal > 0 && Number(payload.totalAmount) < minVal) {
          throw new Error(`Minimum delivery subtotal requirement is $${minVal.toFixed(2)}. Your subtotal: $${Number(payload.totalAmount).toFixed(2)}`);
        }
      }
    } catch (delErr) {
      if (delErr.message.includes('Minimum delivery subtotal')) throw delErr;
      console.warn('[Order Validation] Could not check delivery config:', delErr.message);
    }
  }

  // Server-side Loyalty Reward Validation and Point Deduction
  if (payload.fulfillmentDetails && payload.fulfillmentDetails.redeemedRewardId) {
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

  const deliveryOtp = String(Math.floor(1000 + Math.random() * 9000));

  let result;
  try {
    const [insertResult] = await getDatabasePool().execute(
      `INSERT INTO orders
        (restaurant_id, customer_name, customer_phone, order_number, total_amount, order_status, payment_status, items, fulfillment_details, special_instructions, delivery_otp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        payload.specialInstructions ? payload.specialInstructions.trim() : null,
        deliveryOtp
      ]
    );
    result = insertResult;
  } catch (insertErr) {
    console.error('[Order Service] Database order insertion failed post-payment:', insertErr.message);
    if (payload.paymentStatus === 'Paid' || payload.fulfillmentDetails?.paymentIntentId) {
      try {
        const { logUnfulfilledPayment } = require('./reconciliation.service');
        await logUnfulfilledPayment({
          restaurantId: payload.restaurantId,
          orderNumber: payload.orderNumber,
          customerName: payload.customerName,
          customerPhone: payload.customerPhone,
          totalAmount: payload.totalAmount,
          paymentIntentId: payload.fulfillmentDetails?.paymentIntentId || `pi_${Date.now()}`,
          errorReason: `Order DB insertion failed: ${insertErr.message}`
        });
      } catch (reconErr) {
        console.error('[Reconciliation] Failed to log unfulfilled payment:', reconErr.message);
      }
    }
    throw insertErr;
  }

  const order = await getOrderById(result.insertId);

  try {
    const { syncCustomerOrder } = require('../customer/customer.service');
    await syncCustomerOrder(order.restaurantId, order.customerName, order.customerPhone, '', order.totalAmount, new Date());
  } catch (err) {
    console.error('[CRM] Failed to sync customer on order creation:', err.message);
  }

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

  // Campaign Promo Code Redemption & Revenue Attribution Tracking
  try {
    const promoCode = payload.fulfillmentDetails?.promoCode || payload.fulfillmentDetails?.discountCode || payload.discountCode;
    if (promoCode) {
      const pool = getDatabasePool();
      await pool.execute(
        `UPDATE campaigns
         SET conversions_count = conversions_count + 1,
             revenue_generated = revenue_generated + ?
         WHERE LOWER(discount_code) = LOWER(?) AND restaurant_id = ?`,
        [order.totalAmount, promoCode.trim(), order.restaurantId]
      );
      console.log(`[Campaign] Attributed promo redemption "${promoCode}" to order ${order.orderNumber} ($${order.totalAmount})`);
    }
  } catch (err) {
    console.error('[Campaign] Failed to track promo redemption:', err.message);
  }

  // Award Loyalty Points for order purchase (10 points per $1 spent)
  try {
    const { addLoyaltyPointsByPhone } = require('../loyalty/loyalty.service');
    await addLoyaltyPointsByPhone(order.restaurantId, order.customerPhone, order.totalAmount, order.customerName);
  } catch (err) {
    console.error('[Loyalty] Failed to award points for order:', err.message);
  }

  try {
    const socketUtils = require('../../utils/socket');
    socketUtils.getIO().to(`restaurant_${order.restaurantId}`).emit('NEW_ORDER', order);
  } catch (err) {
    console.error('[Socket] Failed to emit NEW_ORDER event:', err.message);
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
    `SELECT id, restaurant_id AS restaurantId, customer_name AS customerName, customer_phone AS customerPhone, order_number AS orderNumber, total_amount AS totalAmount, order_status AS orderStatus, payment_status AS paymentStatus, items, fulfillment_details AS fulfillmentDetails, special_instructions AS specialInstructions, COALESCE(delivery_otp, '1234') AS deliveryOtp, created_at AS createdAt
     FROM orders
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

async function getOrderByNumber(orderNumber) {
  const [rows] = await getDatabasePool().execute(
    `SELECT id, restaurant_id AS restaurantId, customer_name AS customerName, customer_phone AS customerPhone, order_number AS orderNumber, total_amount AS totalAmount, order_status AS orderStatus, payment_status AS paymentStatus, items, fulfillment_details AS fulfillmentDetails, special_instructions AS specialInstructions, COALESCE(delivery_otp, '1234') AS deliveryOtp, created_at AS createdAt
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
    
    try {
      const socketUtils = require('../../utils/socket');
      socketUtils.getIO().to(`restaurant_${order.restaurantId}`).emit('ORDER_STATUS_CHANGED', order);
    } catch (err) {
      console.error('[Socket] Failed to emit ORDER_STATUS_CHANGED event:', err.message);
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
