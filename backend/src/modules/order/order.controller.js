const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  updateOrderStatus
} = require('./order.service');
const { sendSuccess, sendError } = require('../../utils/apiResponse');
const {
  getAuthenticatedRestaurantId,
  withAuthenticatedRestaurant,
  belongsToAuthenticatedRestaurant
} = require('../../utils/restaurantScope');

async function create(request, response, next) {
  try {
    const order = await createOrder(withAuthenticatedRestaurant(request));
    return sendSuccess(response, { statusCode: 201, message: 'Order created successfully.', data: { order } });
  } catch (error) {
    return next(error);
  }
}

async function list(request, response, next) {
  try {
    const orders = await getOrders({ ...request.query, restaurantId: getAuthenticatedRestaurantId(request) });
    return sendSuccess(response, { statusCode: 200, message: 'Orders fetched successfully.', data: orders });
  } catch (error) {
    return next(error);
  }
}

async function getById(request, response, next) {
  try {
    const order = await getOrderById(request.params.id);
    if (!order) {
      return sendError(response, { statusCode: 404, message: 'Order not found.' });
    }
    if (!belongsToAuthenticatedRestaurant(request, order)) {
      return sendError(response, { statusCode: 403, message: 'Forbidden. Restaurant access mismatch.' });
    }

    return sendSuccess(response, { statusCode: 200, message: 'Order fetched successfully.', data: { order } });
  } catch (error) {
    return next(error);
  }
}

async function update(request, response, next) {
  try {
    const existingOrder = await getOrderById(request.params.id);
    if (!existingOrder) {
      return sendError(response, { statusCode: 404, message: 'Order not found.' });
    }
    if (!belongsToAuthenticatedRestaurant(request, existingOrder)) {
      return sendError(response, { statusCode: 403, message: 'Forbidden. Restaurant access mismatch.' });
    }

    const order = await updateOrder(request.params.id, withAuthenticatedRestaurant(request));
    if (!order) {
      return sendError(response, { statusCode: 404, message: 'Order not found.' });
    }

    try {
      const socketUtils = require('../../utils/socket');
      const io = socketUtils.getIO();
      io.to(`restaurant_${order.restaurantId}`).emit('orderUpdated', order);
    } catch (socketErr) {
      console.error('[Socket] Failed to emit orderUpdated event:', socketErr.message);
    }

    return sendSuccess(response, { statusCode: 200, message: 'Order updated successfully.', data: { order } });
  } catch (error) {
    return next(error);
  }
}

async function remove(request, response, next) {
  try {
    const order = await getOrderById(request.params.id);
    if (!order) {
      return sendError(response, { statusCode: 404, message: 'Order not found.' });
    }
    if (!belongsToAuthenticatedRestaurant(request, order)) {
      return sendError(response, { statusCode: 403, message: 'Forbidden. Restaurant access mismatch.' });
    }

    const deleted = await deleteOrder(request.params.id);
    if (!deleted) {
      return sendError(response, { statusCode: 404, message: 'Order not found.' });
    }

    return sendSuccess(response, { statusCode: 200, message: 'Order deleted successfully.', data: {} });
  } catch (error) {
    return next(error);
  }
}

async function updateStatus(request, response, next) {
  try {
    const { status } = request.body;
    if (!status) {
      return sendError(response, { statusCode: 400, message: 'Status is required.' });
    }

    const existingOrder = await getOrderById(request.params.id);
    if (!existingOrder) {
      return sendError(response, { statusCode: 404, message: 'Order not found.' });
    }
    if (!belongsToAuthenticatedRestaurant(request, existingOrder)) {
      return sendError(response, { statusCode: 403, message: 'Forbidden. Restaurant access mismatch.' });
    }

    const order = await updateOrderStatus(request.params.id, status);
    if (!order) {
      return sendError(response, { statusCode: 404, message: 'Order not found.' });
    }

    try {
      const socketUtils = require('../../utils/socket');
      const io = socketUtils.getIO();
      io.to(`restaurant_${order.restaurantId}`).emit('orderUpdated', order);
    } catch (socketErr) {
      console.error('[Socket] Failed to emit orderUpdated event:', socketErr.message);
    }

    return sendSuccess(response, { statusCode: 200, message: 'Order status updated successfully.', data: { order } });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  create,
  list,
  getById,
  update,
  remove,
  updateStatus
};
