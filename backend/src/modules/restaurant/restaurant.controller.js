const {
  createRestaurant,
  getRestaurants,
  getRestaurantById,
  updateRestaurant,
  updateRestaurantStatus,
  deleteRestaurant
} = require('./restaurant.service');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

async function create(request, response, next) {
  try {
    const userId = request.user?.sub || request.user?.id;
    const restaurant = await createRestaurant(request.body, userId);
    return sendSuccess(response, { statusCode: 201, message: 'Restaurant created successfully.', data: { restaurant } });
  } catch (error) {
    return next(error);
  }
}

async function list(request, response, next) {
  try {
    const restaurants = await getRestaurants();
    return sendSuccess(response, { statusCode: 200, message: 'Restaurants fetched successfully.', data: { restaurants } });
  } catch (error) {
    return next(error);
  }
}

async function getById(request, response, next) {
  try {
    const restaurant = await getRestaurantById(request.params.id);
    if (!restaurant) {
      return sendError(response, { statusCode: 404, message: 'Restaurant not found.' });
    }

    return sendSuccess(response, { statusCode: 200, message: 'Restaurant fetched successfully.', data: { restaurant } });
  } catch (error) {
    return next(error);
  }
}

async function update(request, response, next) {
  try {
    const restaurant = await updateRestaurant(request.params.id, request.body);
    if (!restaurant) {
      return sendError(response, { statusCode: 404, message: 'Restaurant not found.' });
    }

    return sendSuccess(response, { statusCode: 200, message: 'Restaurant updated successfully.', data: { restaurant } });
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
    const restaurant = await updateRestaurantStatus(request.params.id, status);
    return sendSuccess(response, { statusCode: 200, message: 'Restaurant status updated successfully.', data: { restaurant } });
  } catch (error) {
    return next(error);
  }
}

async function remove(request, response, next) {
  try {
    const deleted = await deleteRestaurant(request.params.id);
    if (!deleted) {
      return sendError(response, { statusCode: 404, message: 'Restaurant not found.' });
    }

    return sendSuccess(response, { statusCode: 200, message: 'Restaurant deleted successfully.', data: {} });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  create,
  list,
  getById,
  update,
  updateStatus,
  remove
};
