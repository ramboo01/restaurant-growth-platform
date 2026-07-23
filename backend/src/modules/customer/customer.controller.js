const {
  createCustomer,
  getCustomers,
  getCustomerById,
  getCustomersByRestaurantId,
  updateCustomer,
  deleteCustomer
} = require('./customer.service');
const { sendSuccess, sendError } = require('../../utils/apiResponse');
const {
  getAuthenticatedRestaurantId,
  withAuthenticatedRestaurant,
  belongsToAuthenticatedRestaurant
} = require('../../utils/restaurantScope');

async function create(request, response, next) {
  try {
    const customer = await createCustomer(withAuthenticatedRestaurant(request));
    return sendSuccess(response, { statusCode: 201, message: 'Customer created successfully.', data: { customer } });
  } catch (error) {
    return next(error);
  }
}

async function list(request, response, next) {
  try {
    const customers = await getCustomersByRestaurantId(getAuthenticatedRestaurantId(request), request.query);
    return sendSuccess(response, { statusCode: 200, message: 'Customers fetched successfully.', data: customers });
  } catch (error) {
    return next(error);
  }
}

async function getById(request, response, next) {
  try {
    const customer = await getCustomerById(request.params.id);
    if (!customer) {
      return sendError(response, { statusCode: 404, message: 'Customer not found.' });
    }
    if (!belongsToAuthenticatedRestaurant(request, customer)) {
      return sendError(response, { statusCode: 403, message: 'Forbidden. Restaurant access mismatch.' });
    }

    return sendSuccess(response, { statusCode: 200, message: 'Customer fetched successfully.', data: { customer } });
  } catch (error) {
    return next(error);
  }
}

async function update(request, response, next) {
  try {
    const existingCustomer = await getCustomerById(request.params.id);
    if (!existingCustomer) {
      return sendError(response, { statusCode: 404, message: 'Customer not found.' });
    }
    if (!belongsToAuthenticatedRestaurant(request, existingCustomer)) {
      return sendError(response, { statusCode: 403, message: 'Forbidden. Restaurant access mismatch.' });
    }

    const customer = await updateCustomer(request.params.id, withAuthenticatedRestaurant(request));
    if (!customer) {
      return sendError(response, { statusCode: 404, message: 'Customer not found.' });
    }

    return sendSuccess(response, { statusCode: 200, message: 'Customer updated successfully.', data: { customer } });
  } catch (error) {
    return next(error);
  }
}

async function remove(request, response, next) {
  try {
    const customer = await getCustomerById(request.params.id);
    if (!customer) {
      return sendError(response, { statusCode: 404, message: 'Customer not found.' });
    }
    if (!belongsToAuthenticatedRestaurant(request, customer)) {
      return sendError(response, { statusCode: 403, message: 'Forbidden. Restaurant access mismatch.' });
    }

    const deleted = await deleteCustomer(request.params.id);
    if (!deleted) {
      return sendError(response, { statusCode: 404, message: 'Customer not found.' });
    }

    return sendSuccess(response, { statusCode: 200, message: 'Customer deleted successfully.', data: {} });
  } catch (error) {
    return next(error);
  }
}

async function listByRestaurant(request, response, next) {
  try {
    const customers = await getCustomersByRestaurantId(getAuthenticatedRestaurantId(request), request.query);
    return sendSuccess(response, { statusCode: 200, message: 'Restaurant customers fetched successfully.', data: customers });
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
