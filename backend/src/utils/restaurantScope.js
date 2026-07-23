function getAuthenticatedRestaurantId(request) {
  return request.user?.restaurantId;
}

function withAuthenticatedRestaurant(request, payload = request.body) {
  return {
    ...payload,
    restaurantId: getAuthenticatedRestaurantId(request)
  };
}

function belongsToAuthenticatedRestaurant(request, resource) {
  return String(resource?.restaurantId) === String(getAuthenticatedRestaurantId(request));
}

module.exports = {
  getAuthenticatedRestaurantId,
  withAuthenticatedRestaurant,
  belongsToAuthenticatedRestaurant
};
