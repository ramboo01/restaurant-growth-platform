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
  const userRestaurantId = request.user?.restaurantId;

  if (userRestaurantId === null || userRestaurantId === undefined || userRestaurantId === '') {
    return sendError(response, {
      statusCode: 403,
      message: 'Forbidden. User is not assigned to a restaurant.'
    });
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
