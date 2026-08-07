const express = require('express');
const { getRestaurants, getRestaurantById } = require('../restaurant/restaurant.service');
const { getMenuItemsByRestaurantId } = require('../menu/menu.service');
const { getCategoriesByRestaurantId } = require('../category/category.service');
const { createOrder, getOrderById, getOrderByNumber } = require('../order/order.service');
const { validate } = require('../../middleware/validate');
const { orderSchema } = require('../../validations/order.validation');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

const router = express.Router();

// Get list of all restaurants (public)
router.get('/restaurants', async (req, res, next) => {
  try {
    const restaurants = await getRestaurants();
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Restaurants fetched successfully',
      data: { restaurants }
    });
  } catch (error) {
    return next(error);
  }
});

// Get a specific restaurant by ID (public)
router.get('/restaurants/:restaurantId', async (req, res, next) => {
  try {
    const restaurant = await getRestaurantById(req.params.restaurantId);
    if (!restaurant) {
      return sendError(res, {
        statusCode: 404,
        message: 'Restaurant not found'
      });
    }
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Restaurant fetched successfully',
      data: { restaurant }
    });
  } catch (error) {
    return next(error);
  }
});

// Get menu items for a restaurant (public)
router.get('/restaurants/:restaurantId/menu', async (req, res, next) => {
  try {
    const menuItems = await getMenuItemsByRestaurantId(req.params.restaurantId, req.query);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Menu items fetched successfully',
      data: menuItems
    });
  } catch (error) {
    return next(error);
  }
});

// Get categories for a restaurant (public)
router.get('/restaurants/:restaurantId/categories', async (req, res, next) => {
  try {
    const categories = await getCategoriesByRestaurantId(req.params.restaurantId);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Categories fetched successfully',
      data: { categories }
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/orders', validate(orderSchema), async (req, res, next) => {
  try {
    const order = await createOrder(req.body);

    try {
      const socketUtils = require('../../utils/socket');
      const io = socketUtils.getIO();
      io.to(`restaurant_${order.restaurantId}`).emit('newOrder', order);
    } catch (socketErr) {
      console.error('[Socket] Failed to emit newOrder event:', socketErr.message);
    }

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Order created successfully',
      data: { order }
    });
  } catch (error) {
    return next(error);
  }
});

// Get specific order details publicly by ID
router.get('/orders/:id', async (req, res, next) => {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) {
      return sendError(res, {
        statusCode: 404,
        message: 'Order not found'
      });
    }
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Order fetched successfully',
      data: { order }
    });
  } catch (error) {
    return next(error);
  }
});

// Get specific order details publicly by order number
router.get('/orders/number/:orderNumber', async (req, res, next) => {
  try {
    const order = await getOrderByNumber(req.params.orderNumber);
    if (!order) {
      return sendError(res, {
        statusCode: 404,
        message: 'Order not found'
      });
    }
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Order fetched successfully',
      data: { order }
    });
  } catch (error) {
    return next(error);
  }
});

const { getDatabasePool } = require('../../config/database');

// Check loyalty points by phone & restaurantId
router.get('/loyalty/check', async (req, res, next) => {
  try {
    const { phone, restaurantId, customerName } = req.query;
    if (!phone || !restaurantId) {
      return sendError(res, {
        statusCode: 400,
        message: 'Missing phone or restaurantId query parameters'
      });
    }

    const trimmedPhone = phone.trim();
    const pool = getDatabasePool();

    let [rows] = await pool.execute(
      `SELECT id, customer_name AS customerName, phone, points, tier, joined_at AS joinedAt
       FROM loyalty_members
       WHERE restaurant_id = ? AND phone = ?
       LIMIT 1`,
      [restaurantId, trimmedPhone]
    );

    if (rows.length === 0) {
      const name = customerName ? customerName.trim() : 'Valued Guest';
      await pool.execute(
        `INSERT INTO loyalty_members (restaurant_id, customer_name, phone, points, tier)
         VALUES (?, ?, ?, 0, 'Bronze')`,
        [restaurantId, name, trimmedPhone]
      );

      [rows] = await pool.execute(
        `SELECT id, customer_name AS customerName, phone, points, tier, joined_at AS joinedAt
         FROM loyalty_members
         WHERE restaurant_id = ? AND phone = ?
         LIMIT 1`,
        [restaurantId, trimmedPhone]
      );
    } else if (customerName && customerName.trim() && rows[0].customerName === 'Valued Guest') {
      // Update from generic name to real name
      await pool.execute(
        `UPDATE loyalty_members SET customer_name = ? WHERE id = ?`,
        [customerName.trim(), rows[0].id]
      );
      rows[0].customerName = customerName.trim();
    }

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Loyalty member profile fetched successfully',
      data: rows[0]
    });
  } catch (error) {
    return next(error);
  }
});

// Redeem loyalty points publicly
router.post('/loyalty/redeem', async (req, res, next) => {
  try {
    const { phone, restaurantId, points } = req.body;
    if (!phone || !restaurantId || points === undefined) {
      return sendError(res, {
        statusCode: 400,
        message: 'Missing phone, restaurantId, or points in request body'
      });
    }

    const pool = getDatabasePool();
    const trimmedPhone = phone.trim();

    const [members] = await pool.execute(
      `SELECT id, points FROM loyalty_members WHERE restaurant_id = ? AND phone = ? LIMIT 1`,
      [restaurantId, trimmedPhone]
    );

    if (members.length === 0) {
      return sendError(res, {
        statusCode: 404,
        message: 'Loyalty member profile not found'
      });
    }

    const member = members[0];
    if (member.points < points) {
      return sendError(res, {
        statusCode: 400,
        message: 'Insufficient points to redeem this reward'
      });
    }

    const newPoints = member.points - points;
    let tier = 'Bronze';
    if (newPoints >= 1000) tier = 'Gold VIP';
    else if (newPoints >= 500) tier = 'Silver';

    await pool.execute(
      `UPDATE loyalty_members SET points = ?, tier = ? WHERE id = ?`,
      [newPoints, tier, member.id]
    );

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Points redeemed successfully',
      data: { id: member.id, points: newPoints, tier }
    });
  } catch (error) {
    return next(error);
  }
});

// Get active rewards catalog
router.get('/loyalty/rewards', async (req, res, next) => {
  try {
    const { restaurantId } = req.query;
    if (!restaurantId) {
      return sendError(res, {
        statusCode: 400,
        message: 'Missing restaurantId query parameter'
      });
    }

    const [rows] = await getDatabasePool().execute(
      `SELECT id, name, description, points_required AS pointsRequired, COALESCE(discount_amount, ROUND(points_required * 0.10, 2)) AS discountAmount, status
       FROM loyalty_rewards
       WHERE restaurant_id = ? AND status = 'Active'
       ORDER BY points_required ASC`,
      [restaurantId]
    );

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Loyalty rewards fetched successfully',
      data: { rewards: rows }
    });
  } catch (error) {
    return next(error);
  }
});

// Get active announcements
router.get('/announcements', async (req, res, next) => {
  try {
    const { getDatabasePool } = require('../../config/database');
    const [rows] = await getDatabasePool().execute(
      `SELECT id, title, message, type, target_role AS targetRole, created_at AS createdAt
       FROM system_announcements
       WHERE is_active = TRUE
       ORDER BY created_at DESC
       LIMIT 5`
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: 'System announcements fetched successfully',
      data: { announcements: rows }
    });
  } catch (error) {
    return next(error);
  }
});

// Submit public customer review / feedback
router.post('/reviews', async (req, res, next) => {
  try {
    const { restaurantId, customerName, rating, content, platform = 'Direct', userId = null } = req.body;
    if (!restaurantId || !customerName || rating === undefined || !content) {
      return sendError(res, {
        statusCode: 400,
        message: 'Missing restaurantId, customerName, rating, or content in request body'
      });
    }

    const pool = getDatabasePool();
    const [result] = await pool.execute(
      `INSERT INTO customer_reviews (user_id, restaurant_id, customer_name, platform, rating, content)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId || null, restaurantId, customerName.trim(), platform, rating, content.trim()]
    );

    try {
      const socketUtils = require('../../utils/socket');
      const io = socketUtils.getIO();
      io.to(`restaurant_${restaurantId}`).emit('newReview', {
        id: result.insertId,
        restaurantId,
        customerName: customerName.trim(),
        platform,
        rating,
        content: content.trim(),
        aiReplyDraft: null,
        replyStatus: 'Pending',
        createdAt: new Date().toISOString()
      });
    } catch (socketErr) {
      console.error('[Socket] Failed to emit newReview event:', socketErr.message);
    }

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Feedback submitted successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

