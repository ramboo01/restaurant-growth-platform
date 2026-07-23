const {
  createMenuItem,
  getMenuItems,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem,
  getMenuItemsByRestaurantId
} = require('./menu.service');
const { sendSuccess, sendError } = require('../../utils/apiResponse');
const {
  getAuthenticatedRestaurantId,
  withAuthenticatedRestaurant,
  belongsToAuthenticatedRestaurant
} = require('../../utils/restaurantScope');

async function create(request, response, next) {
  try {
    const menuItem = await createMenuItem(withAuthenticatedRestaurant(request));
    return sendSuccess(response, { statusCode: 201, message: 'Menu item created successfully.', data: { menuItem } });
  } catch (error) {
    return next(error);
  }
}

async function list(request, response, next) {
  try {
    const menuItems = await getMenuItemsByRestaurantId(getAuthenticatedRestaurantId(request), request.query);
    return sendSuccess(response, { statusCode: 200, message: 'Menu items fetched successfully.', data: menuItems });
  } catch (error) {
    return next(error);
  }
}

async function getById(request, response, next) {
  try {
    const menuItem = await getMenuItemById(request.params.id);
    if (!menuItem) {
      return sendError(response, { statusCode: 404, message: 'Menu item not found.' });
    }
    if (!belongsToAuthenticatedRestaurant(request, menuItem)) {
      return sendError(response, { statusCode: 403, message: 'Forbidden. Restaurant access mismatch.' });
    }

    return sendSuccess(response, { statusCode: 200, message: 'Menu item fetched successfully.', data: { menuItem } });
  } catch (error) {
    return next(error);
  }
}

async function update(request, response, next) {
  try {
    const existingMenuItem = await getMenuItemById(request.params.id);
    if (!existingMenuItem) {
      return sendError(response, { statusCode: 404, message: 'Menu item not found.' });
    }
    if (!belongsToAuthenticatedRestaurant(request, existingMenuItem)) {
      return sendError(response, { statusCode: 403, message: 'Forbidden. Restaurant access mismatch.' });
    }

    const menuItem = await updateMenuItem(request.params.id, withAuthenticatedRestaurant(request));
    if (!menuItem) {
      return sendError(response, { statusCode: 404, message: 'Menu item not found.' });
    }

    return sendSuccess(response, { statusCode: 200, message: 'Menu item updated successfully.', data: { menuItem } });
  } catch (error) {
    return next(error);
  }
}

async function remove(request, response, next) {
  try {
    const menuItem = await getMenuItemById(request.params.id);
    if (!menuItem) {
      return sendError(response, { statusCode: 404, message: 'Menu item not found.' });
    }
    if (!belongsToAuthenticatedRestaurant(request, menuItem)) {
      return sendError(response, { statusCode: 403, message: 'Forbidden. Restaurant access mismatch.' });
    }

    const deleted = await deleteMenuItem(request.params.id);
    if (!deleted) {
      return sendError(response, { statusCode: 404, message: 'Menu item not found.' });
    }

    return sendSuccess(response, { statusCode: 200, message: 'Menu item deleted successfully.', data: {} });
  } catch (error) {
    return next(error);
  }
}

async function listByRestaurant(request, response, next) {
  try {
    const menuItems = await getMenuItemsByRestaurantId(getAuthenticatedRestaurantId(request), request.query);
    return sendSuccess(response, { statusCode: 200, message: 'Restaurant menu items fetched successfully.', data: menuItems });
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
