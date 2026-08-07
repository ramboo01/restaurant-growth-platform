function getAuthenticatedRestaurantId(request) {
  // If user is Owner or Admin, they can switch active restaurant context via X-Restaurant-Id header
  const role = request.user?.role?.toLowerCase();
  if (role === 'owner' || role === 'admin') {
    const overrideId = request.headers['x-restaurant-id'] || request.headers['X-Restaurant-Id'];
    if (overrideId) {
      return Number(overrideId);
    }
  }
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

