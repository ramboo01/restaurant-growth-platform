const express = require('express');
const router = express.Router();
const { verifyJwt } = require('../auth/jwt.middleware');
const {
  getCustomerNotifications,
  markNotificationsRead,
  countUnread
} = require('./customerNotification.service');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

// All routes require authentication
router.use(verifyJwt);

// GET /api/customer/notifications — fetch all notifications for the logged-in user
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notifications = await getCustomerNotifications(userId);
    const unreadCount = await countUnread(userId);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Notifications fetched',
      data: { notifications, unreadCount }
    });
  } catch (err) {
    return next(err);
  }
});

// PUT /api/customer/notifications/read — mark all as read
router.put('/read', async (req, res, next) => {
  try {
    const userId = req.user.id;
    await markNotificationsRead(userId);
    return sendSuccess(res, { statusCode: 200, message: 'All notifications marked as read', data: {} });
  } catch (err) {
    return next(err);
  }
});

// PUT /api/customer/notifications/:id/read — mark one as read
router.put('/:id/read', async (req, res, next) => {
  try {
    const userId = req.user.id;
    await markNotificationsRead(userId, req.params.id);
    return sendSuccess(res, { statusCode: 200, message: 'Notification marked as read', data: {} });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
