const { sendError } = require('../utils/apiResponse');

function extractRequestedRestaurantId(request) {
  return (
    request.params?.restaurantId ??
    request.body?.restaurantId ??
    request.query?.restaurantId ??
    null
  );
}

function verifyRestaurantOwnership(request, response, next) {
  const requestedRestaurantId = extractRequestedRestaurantId(request);
  let userRestaurantId = request.user?.restaurantId;

  // Support X-Restaurant-Id header for restaurant switching
  const headerRestaurantId = request.headers['x-restaurant-id'];
  if (headerRestaurantId && !isNaN(Number(headerRestaurantId))) {
    // Use the header restaurant ID as the active context
    userRestaurantId = Number(headerRestaurantId);
    if (request.user) {
      request.user.restaurantId = userRestaurantId;
    }
  }

  if (!userRestaurantId) {
    userRestaurantId = 1;
    if (request.user) {
      request.user.restaurantId = 1;
    }
  }

  if (requestedRestaurantId === null || requestedRestaurantId === undefined || requestedRestaurantId === '') {
    request.restaurantId = userRestaurantId;
    return next();
  }

  if (String(userRestaurantId) !== String(requestedRestaurantId)) {
    return sendError(response, {
      statusCode: 403,
      message: 'Forbidden. Restaurant access mismatch.'
    });
  }

  request.restaurantId = userRestaurantId;
  return next();
}

module.exports = {
  verifyRestaurantOwnership
};
