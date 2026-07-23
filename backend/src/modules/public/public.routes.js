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

module.exports = router;
