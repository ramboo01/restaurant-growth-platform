const {
  createDriver,
  getDrivers,
  getDriverById,
  getDriversByRestaurantId,
  updateDriver,
  deleteDriver
} = require('./driver.service');
const { sendSuccess, sendError } = require('../../utils/apiResponse');
const {
  getAuthenticatedRestaurantId,
  withAuthenticatedRestaurant,
  belongsToAuthenticatedRestaurant
} = require('../../utils/restaurantScope');

async function create(request, response, next) {
  try {
    const driver = await createDriver(withAuthenticatedRestaurant(request));
    return sendSuccess(response, { statusCode: 201, message: 'Driver created successfully.', data: { driver } });
  } catch (error) {
    return next(error);
  }
}

async function list(request, response, next) {
  try {
    const drivers = await getDriversByRestaurantId(getAuthenticatedRestaurantId(request), request.query);
    return sendSuccess(response, { statusCode: 200, message: 'Drivers fetched successfully.', data: drivers });
  } catch (error) {
    return next(error);
  }
}

async function getById(request, response, next) {
  try {
    const driver = await getDriverById(request.params.id);
    if (!driver) {
      return sendError(response, { statusCode: 404, message: 'Driver not found.' });
    }
    if (!belongsToAuthenticatedRestaurant(request, driver)) {
      return sendError(response, { statusCode: 403, message: 'Forbidden. Restaurant access mismatch.' });
    }

    return sendSuccess(response, { statusCode: 200, message: 'Driver fetched successfully.', data: { driver } });
  } catch (error) {
    return next(error);
  }
}

async function update(request, response, next) {
  try {
    const existingDriver = await getDriverById(request.params.id);
    if (!existingDriver) {
      return sendError(response, { statusCode: 404, message: 'Driver not found.' });
    }
    if (!belongsToAuthenticatedRestaurant(request, existingDriver)) {
      return sendError(response, { statusCode: 403, message: 'Forbidden. Restaurant access mismatch.' });
    }

    const driver = await updateDriver(request.params.id, withAuthenticatedRestaurant(request));
    if (!driver) {
      return sendError(response, { statusCode: 404, message: 'Driver not found.' });
    }

    return sendSuccess(response, { statusCode: 200, message: 'Driver updated successfully.', data: { driver } });
  } catch (error) {
    return next(error);
  }
}

async function remove(request, response, next) {
  try {
    const driver = await getDriverById(request.params.id);
    if (!driver) {
      return sendError(response, { statusCode: 404, message: 'Driver not found.' });
    }
    if (!belongsToAuthenticatedRestaurant(request, driver)) {
      return sendError(response, { statusCode: 403, message: 'Forbidden. Restaurant access mismatch.' });
    }

    const deleted = await deleteDriver(request.params.id);
    if (!deleted) {
      return sendError(response, { statusCode: 404, message: 'Driver not found.' });
    }

    return sendSuccess(response, { statusCode: 200, message: 'Driver deleted successfully.', data: {} });
  } catch (error) {
    return next(error);
  }
}

async function listByRestaurant(request, response, next) {
  try {
    const drivers = await getDriversByRestaurantId(getAuthenticatedRestaurantId(request), request.query);
    return sendSuccess(response, { statusCode: 200, message: 'Restaurant drivers fetched successfully.', data: drivers });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  create,
  list,
  getById,
  update,
  remove,
  listByRestaurant
};
