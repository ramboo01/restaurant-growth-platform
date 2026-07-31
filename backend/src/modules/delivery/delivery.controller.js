const deliveryService = require('./delivery.service');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

async function getDeliveryConfig(req, res, next) {
  try {
    const restaurantId = req.user?.restaurantId || 1;
    const config = await deliveryService.getDeliveryConfig(restaurantId);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Delivery configuration fetched successfully',
      data: config
    });
  } catch (err) {
    return next(err);
  }
}

async function getPublicDeliveryConfig(req, res, next) {
  try {
    const restaurantId = req.params.restaurantId || 1;
    const config = await deliveryService.getDeliveryConfig(restaurantId);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Public delivery config fetched',
      data: config
    });
  } catch (err) {
    return next(err);
  }
}

async function updateDeliveryConfig(req, res, next) {
  try {
    const restaurantId = req.user?.restaurantId || 1;
    const updated = await deliveryService.updateDeliveryConfig(restaurantId, req.body);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Delivery configurations and dispatch logic saved successfully',
      data: updated
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getDeliveryConfig,
  getPublicDeliveryConfig,
  updateDeliveryConfig
};
