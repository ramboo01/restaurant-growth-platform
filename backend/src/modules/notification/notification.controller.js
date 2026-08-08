const {
  createNotification,
  getNotifications,
  getNotificationById,
  getNotificationsByRestaurantId,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} = require('./notification.service');
const { sendSuccess, sendError } = require('../../utils/apiResponse');
const {
  getAuthenticatedRestaurantId,
  withAuthenticatedRestaurant,
  belongsToAuthenticatedRestaurant
} = require('../../utils/restaurantScope');

async function create(request, response, next) {
  try {
    const notification = await createNotification(withAuthenticatedRestaurant(request));
    return sendSuccess(response, { statusCode: 201, message: 'Notification created successfully.', data: { notification } });
  } catch (error) {
    return next(error);
  }
}

async function list(request, response, next) {
  try {
    const notifications = await getNotificationsByRestaurantId(getAuthenticatedRestaurantId(request), request.query);
    return sendSuccess(response, { statusCode: 200, message: 'Notifications fetched successfully.', data: notifications });
  } catch (error) {
    return next(error);
  }
}

async function getById(request, response, next) {
  try {
    const notification = await getNotificationById(request.params.id);
    if (!notification) {
      return sendError(response, { statusCode: 404, message: 'Notification not found.' });
    }
    if (notification.restaurantId && !belongsToAuthenticatedRestaurant(request, notification)) {
      return sendError(response, { statusCode: 403, message: 'Forbidden. Restaurant access mismatch.' });
    }

    return sendSuccess(response, { statusCode: 200, message: 'Notification fetched successfully.', data: { notification } });
  } catch (error) {
    return next(error);
  }
}

async function markRead(request, response, next) {
  try {
    const existingNotification = await getNotificationById(request.params.id);
    if (!existingNotification) {
      return sendError(response, { statusCode: 404, message: 'Notification not found.' });
    }
    if (existingNotification.restaurantId && !belongsToAuthenticatedRestaurant(request, existingNotification)) {
      return sendError(response, { statusCode: 403, message: 'Forbidden. Restaurant access mismatch.' });
    }

    const notification = await markNotificationAsRead(request.params.id);
    if (!notification) {
      return sendError(response, { statusCode: 404, message: 'Notification not found.' });
    }

    return sendSuccess(response, { statusCode: 200, message: 'Notification marked as read successfully.', data: { notification } });
  } catch (error) {
    return next(error);
  }
}

async function remove(request, response, next) {
  try {
    const notification = await getNotificationById(request.params.id);
    if (!notification) {
      return sendError(response, { statusCode: 404, message: 'Notification not found.' });
    }
    if (!belongsToAuthenticatedRestaurant(request, notification)) {
      return sendError(response, { statusCode: 403, message: 'Forbidden. Restaurant access mismatch.' });
    }

    const deleted = await deleteNotification(request.params.id);
    if (!deleted) {
      return sendError(response, { statusCode: 404, message: 'Notification not found.' });
    }

    return sendSuccess(response, { statusCode: 200, message: 'Notification deleted successfully.', data: {} });
  } catch (error) {
    return next(error);
  }
}

async function listByRestaurant(request, response, next) {
  try {
    const notifications = await getNotificationsByRestaurantId(getAuthenticatedRestaurantId(request), request.query);
    return sendSuccess(response, { statusCode: 200, message: 'Restaurant notifications fetched successfully.', data: notifications });
  } catch (error) {
    return next(error);
  }
}

async function markAllRead(request, response, next) {
  try {
    const restaurantId = getAuthenticatedRestaurantId(request);
    const userId = request.user?.id || null;
    await markAllNotificationsAsRead(restaurantId, userId);
    return sendSuccess(response, { statusCode: 200, message: 'All notifications marked as read successfully.', data: {} });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  create,
  list,
  getById,
  markRead,
  markAllRead,
  remove,
  listByRestaurant
};
