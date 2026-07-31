function getAuthenticatedRestaurantId(request) {
  return request.user?.restaurantId || request.restaurantId || 1;
}

function withAuthenticatedRestaurant(request, payload = request.body) {
  return {
    ...payload,
    restaurantId: getAuthenticatedRestaurantId(request)
  };
}

function belongsToAuthenticatedRestaurant(request, resource) {
  const currentId = getAuthenticatedRestaurantId(request);
  return !resource?.restaurantId || String(resource.restaurantId) === String(currentId);
}

module.exports = {
  getAuthenticatedRestaurantId,
  withAuthenticatedRestaurant,
  belongsToAuthenticatedRestaurant
};

