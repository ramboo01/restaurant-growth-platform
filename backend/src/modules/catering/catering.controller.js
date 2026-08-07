const cateringService = require('./catering.service');
const { sendSuccess } = require('../../utils/apiResponse');

/**
 * POST /api/catering/request — Public, guest submits catering inquiry
 */
async function submitCateringRequest(req, res, next) {
  try {
    const order = await cateringService.createCateringRequest(req.body);
    return sendSuccess(res, { statusCode: 201, message: 'Catering request submitted successfully', data: order });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/catering/my-orders?email=x — Public, guest tracks orders by email
 */
async function getMyOrders(req, res, next) {
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required to look up your catering orders.' });
    }
    const orders = await cateringService.getOrdersByEmail(email.trim().toLowerCase());
    return sendSuccess(res, { statusCode: 200, message: 'Catering orders fetched', data: orders });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/catering/restaurant/:restaurantId — Owner/Admin, all orders for a restaurant
 */
async function getRestaurantOrders(req, res, next) {
  try {
    const restaurantId = req.params.restaurantId || req.user?.restaurantId || 1;
    const [orders, counts] = await Promise.all([
      cateringService.getOrdersByRestaurant(restaurantId),
      cateringService.getSummaryCounts(restaurantId)
    ]);
    return sendSuccess(res, { statusCode: 200, message: 'Restaurant catering orders fetched', data: { orders, counts } });
  } catch (err) {
    return next(err);
  }
}

/**
 * PATCH /api/catering/:id/status — Owner/Admin updates status
 */
async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, ownerNotes } = req.body;
    const validStatuses = ['New Inquiry', 'Confirmed', 'Follow-Up Required', 'In Preparation', 'Ready for Dispatch', 'Delivered', 'Completed', 'Declined', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }
    const updated = await cateringService.updateStatus(id, status, ownerNotes);
    return sendSuccess(res, { statusCode: 200, message: 'Catering order status updated', data: updated });
  } catch (err) {
    return next(err);
  }
}

/**
 * PATCH /api/catering/:id/notes — Owner adds internal notes
 */
async function updateOrderNotes(req, res, next) {
  try {
    const { id } = req.params;
    const { ownerNotes } = req.body;
    const updated = await cateringService.updateNotes(id, ownerNotes || '');
    return sendSuccess(res, { statusCode: 200, message: 'Notes updated', data: updated });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/catering/staff/:restaurantId — Staff sees confirmed events
 */
async function getStaffEvents(req, res, next) {
  try {
    const restaurantId = req.params.restaurantId || req.user?.restaurantId || 1;
    const events = await cateringService.getStaffCateringEvents(restaurantId);
    return sendSuccess(res, { statusCode: 200, message: 'Staff catering events fetched', data: events });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  submitCateringRequest,
  getMyOrders,
  getRestaurantOrders,
  updateOrderStatus,
  updateOrderNotes,
  getStaffEvents
};
