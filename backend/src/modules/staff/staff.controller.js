const {
  createStaff,
  getStaff,
  getStaffById,
  getStaffByRestaurantId,
  updateStaff,
  deleteStaff
} = require('./staff.service');
const { sendSuccess, sendError } = require('../../utils/apiResponse');
const {
  getAuthenticatedRestaurantId,
  withAuthenticatedRestaurant,
  belongsToAuthenticatedRestaurant
} = require('../../utils/restaurantScope');

async function create(request, response, next) {
  try {
    const staff = await createStaff(withAuthenticatedRestaurant(request));
    return sendSuccess(response, { statusCode: 201, message: 'Staff member created successfully.', data: { staff } });
  } catch (error) {
    return next(error);
  }
}

async function list(request, response, next) {
  try {
    const staff = await getStaffByRestaurantId(getAuthenticatedRestaurantId(request), request.query);
    return sendSuccess(response, { statusCode: 200, message: 'Staff members fetched successfully.', data: staff });
  } catch (error) {
    return next(error);
  }
}

async function getById(request, response, next) {
  try {
    const staff = await getStaffById(request.params.id);
    if (!staff) {
      return sendError(response, { statusCode: 404, message: 'Staff member not found.' });
    }
    if (!belongsToAuthenticatedRestaurant(request, staff)) {
      return sendError(response, { statusCode: 403, message: 'Forbidden. Restaurant access mismatch.' });
    }

    return sendSuccess(response, { statusCode: 200, message: 'Staff member fetched successfully.', data: { staff } });
  } catch (error) {
    return next(error);
  }
}

async function update(request, response, next) {
  try {
    const existingStaff = await getStaffById(request.params.id);
    if (!existingStaff) {
      return sendError(response, { statusCode: 404, message: 'Staff member not found.' });
    }
    if (!belongsToAuthenticatedRestaurant(request, existingStaff)) {
      return sendError(response, { statusCode: 403, message: 'Forbidden. Restaurant access mismatch.' });
    }

    const staff = await updateStaff(request.params.id, withAuthenticatedRestaurant(request));
    if (!staff) {
      return sendError(response, { statusCode: 404, message: 'Staff member not found.' });
    }

    return sendSuccess(response, { statusCode: 200, message: 'Staff member updated successfully.', data: { staff } });
  } catch (error) {
    return next(error);
  }
}

async function remove(request, response, next) {
  try {
    const staff = await getStaffById(request.params.id);
    if (!staff) {
      return sendError(response, { statusCode: 404, message: 'Staff member not found.' });
    }
    if (!belongsToAuthenticatedRestaurant(request, staff)) {
      return sendError(response, { statusCode: 403, message: 'Forbidden. Restaurant access mismatch.' });
    }

    const deleted = await deleteStaff(request.params.id);
    if (!deleted) {
      return sendError(response, { statusCode: 404, message: 'Staff member not found.' });
    }

    return sendSuccess(response, { statusCode: 200, message: 'Staff member deleted successfully.', data: {} });
  } catch (error) {
    return next(error);
  }
}

async function listByRestaurant(request, response, next) {
  try {
    const staff = await getStaffByRestaurantId(getAuthenticatedRestaurantId(request), request.query);
    return sendSuccess(response, { statusCode: 200, message: 'Restaurant staff fetched successfully.', data: staff });
  } catch (error) {
    return next(error);
  }
}

async function clockIn(request, response, next) {
  try {
    const { clockInStaff } = require('./staff.service');
    const staffId = request.body.staffId || request.user?.id || 1;
    const restaurantId = getAuthenticatedRestaurantId(request);

    const result = await clockInStaff(staffId, restaurantId);
    if (result.error) {
      return sendError(response, { statusCode: 400, message: result.error });
    }

    return sendSuccess(response, { statusCode: 200, message: 'Clock-in recorded successfully.', data: result });
  } catch (error) {
    return next(error);
  }
}

async function clockOut(request, response, next) {
  try {
    const { clockOutStaff } = require('./staff.service');
    const staffId = request.body.staffId || request.user?.id || 1;

    const result = await clockOutStaff(staffId);
    if (result.error) {
      return sendError(response, { statusCode: 400, message: result.error });
    }

    return sendSuccess(response, { statusCode: 200, message: 'Clock-out recorded successfully.', data: result });
  } catch (error) {
    return next(error);
  }
}

async function attendanceHistory(request, response, next) {
  try {
    const { getAttendanceHistory } = require('./staff.service');
    const restaurantId = getAuthenticatedRestaurantId(request);
    const history = await getAttendanceHistory(restaurantId);

    return sendSuccess(response, { statusCode: 200, message: 'Attendance history fetched successfully.', data: { history } });
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
  clockIn,
  clockOut,
  attendanceHistory
};

