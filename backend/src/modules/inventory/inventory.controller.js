const {
  createInventoryItem,
  getInventoryItems,
  getInventoryItemById,
  getInventoryByRestaurantId,
  updateInventoryItem,
  deleteInventoryItem
} = require('./inventory.service');
const { sendSuccess, sendError } = require('../../utils/apiResponse');
const {
  getAuthenticatedRestaurantId,
  withAuthenticatedRestaurant,
  belongsToAuthenticatedRestaurant
} = require('../../utils/restaurantScope');

async function create(request, response, next) {
  try {
    const inventoryItem = await createInventoryItem(withAuthenticatedRestaurant(request));
    return sendSuccess(response, { statusCode: 201, message: 'Inventory item created successfully.', data: { inventoryItem } });
  } catch (error) {
    return next(error);
  }
}

async function list(request, response, next) {
  try {
    const inventoryItems = await getInventoryByRestaurantId(getAuthenticatedRestaurantId(request), request.query);
    return sendSuccess(response, { statusCode: 200, message: 'Inventory items fetched successfully.', data: inventoryItems });
  } catch (error) {
    return next(error);
  }
}

async function getById(request, response, next) {
  try {
    const inventoryItem = await getInventoryItemById(request.params.id);
    if (!inventoryItem) {
      return sendError(response, { statusCode: 404, message: 'Inventory item not found.' });
    }
    if (!belongsToAuthenticatedRestaurant(request, inventoryItem)) {
      return sendError(response, { statusCode: 403, message: 'Forbidden. Restaurant access mismatch.' });
    }

    return sendSuccess(response, { statusCode: 200, message: 'Inventory item fetched successfully.', data: { inventoryItem } });
  } catch (error) {
    return next(error);
  }
}

async function update(request, response, next) {
  try {
    const existingInventoryItem = await getInventoryItemById(request.params.id);
    if (!existingInventoryItem) {
      return sendError(response, { statusCode: 404, message: 'Inventory item not found.' });
    }
    if (!belongsToAuthenticatedRestaurant(request, existingInventoryItem)) {
      return sendError(response, { statusCode: 403, message: 'Forbidden. Restaurant access mismatch.' });
    }

    const inventoryItem = await updateInventoryItem(request.params.id, withAuthenticatedRestaurant(request));
    if (!inventoryItem) {
      return sendError(response, { statusCode: 404, message: 'Inventory item not found.' });
    }

    return sendSuccess(response, { statusCode: 200, message: 'Inventory item updated successfully.', data: { inventoryItem } });
  } catch (error) {
    return next(error);
  }
}

async function remove(request, response, next) {
  try {
    const inventoryItem = await getInventoryItemById(request.params.id);
    if (!inventoryItem) {
      return sendError(response, { statusCode: 404, message: 'Inventory item not found.' });
    }
    if (!belongsToAuthenticatedRestaurant(request, inventoryItem)) {
      return sendError(response, { statusCode: 403, message: 'Forbidden. Restaurant access mismatch.' });
    }

    const deleted = await deleteInventoryItem(request.params.id);
    if (!deleted) {
      return sendError(response, { statusCode: 404, message: 'Inventory item not found.' });
    }

    return sendSuccess(response, { statusCode: 200, message: 'Inventory item deleted successfully.', data: {} });
  } catch (error) {
    return next(error);
  }
}

async function listByRestaurant(request, response, next) {
  try {
    const inventoryItems = await getInventoryByRestaurantId(getAuthenticatedRestaurantId(request), request.query);
    return sendSuccess(response, { statusCode: 200, message: 'Restaurant inventory fetched successfully.', data: inventoryItems });
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
