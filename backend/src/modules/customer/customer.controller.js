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

const socketUtils = require('../../utils/socket');

async function create(request, response, next) {
  try {
    const customer = await createCustomer(withAuthenticatedRestaurant(request));

    try {
      const io = socketUtils.getIO();
      if (io) {
        io.emit('newCustomer', { customer });
        io.emit('customerCreated', { customer });
        if (customer.restaurantId) {
          io.to(`restaurant_${customer.restaurantId}`).emit('newCustomer', { customer });
          io.to(`restaurant_${customer.restaurantId}`).emit('customerCreated', { customer });
        }
      }
    } catch {
      // socket fallback
    }

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

async function erasure(request, response, next) {
  try {
    const customer = await getCustomerById(request.params.id);
    if (!customer) {
      return sendError(response, { statusCode: 404, message: 'Customer not found.' });
    }
    if (!belongsToAuthenticatedRestaurant(request, customer)) {
      return sendError(response, { statusCode: 403, message: 'Forbidden. Restaurant access mismatch.' });
    }

    const { anonymizeCustomerProfile } = require('./customer.service');
    const success = await anonymizeCustomerProfile(request.params.id);
    if (!success) {
      return sendError(response, { statusCode: 400, message: 'Erasure process failed.' });
    }

    return sendSuccess(response, { statusCode: 200, message: 'Profile data anonymized successfully per GDPR request.', data: {} });
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
  listByRestaurant,
  erasure
};

