const {
  createInventoryItem,
  getInventoryItems,
  getInventoryItemById,
  getInventoryByRestaurantId,
  updateInventoryItem,
  deleteInventoryItem,
  stockIn: stockInService,
  recordUsage: recordUsageService,
  recordWastage: recordWastageService,
  adjustStock: adjustStockService,
  getTransactions: getTransactionsService,
  getTransactionSummary: getTransactionSummaryService
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

// ─── Transaction Endpoints ────────────────────────────────

async function stockIn(request, response, next) {
  try {
    const restaurantId = getAuthenticatedRestaurantId(request);
    const result = await stockInService(request.params.id, restaurantId, {
      ...request.body,
      performedBy: request.body.performedBy || request.user?.name || 'Owner'
    });
    return sendSuccess(response, { statusCode: 200, message: 'Stock received and recorded.', data: result });
  } catch (error) {
    return next(error);
  }
}

async function recordUsage(request, response, next) {
  try {
    const restaurantId = getAuthenticatedRestaurantId(request);
    const result = await recordUsageService(request.params.id, restaurantId, {
      ...request.body,
      performedBy: request.body.performedBy || request.user?.name || 'Staff'
    });
    return sendSuccess(response, { statusCode: 200, message: 'Usage recorded successfully.', data: result });
  } catch (error) {
    return next(error);
  }
}

async function recordWastage(request, response, next) {
  try {
    const restaurantId = getAuthenticatedRestaurantId(request);
    const result = await recordWastageService(request.params.id, restaurantId, {
      ...request.body,
      performedBy: request.body.performedBy || request.user?.name || 'Staff'
    });
    return sendSuccess(response, { statusCode: 200, message: 'Wastage logged successfully.', data: result });
  } catch (error) {
    return next(error);
  }
}

async function adjustStockCtrl(request, response, next) {
  try {
    const restaurantId = getAuthenticatedRestaurantId(request);
    const result = await adjustStockService(request.params.id, restaurantId, {
      ...request.body,
      performedBy: request.body.performedBy || request.user?.name || 'Owner'
    });
    return sendSuccess(response, { statusCode: 200, message: 'Stock adjusted successfully.', data: result });
  } catch (error) {
    return next(error);
  }
}

async function transactionHistory(request, response, next) {
  try {
    const restaurantId = getAuthenticatedRestaurantId(request);
    const transactions = await getTransactionsService(restaurantId, request.query);
    return sendSuccess(response, { statusCode: 200, message: 'Transaction history fetched.', data: { transactions } });
  } catch (error) {
    return next(error);
  }
}

async function transactionSummary(request, response, next) {
  try {
    const restaurantId = getAuthenticatedRestaurantId(request);
    const summary = await getTransactionSummaryService(restaurantId);
    return sendSuccess(response, { statusCode: 200, message: 'Transaction summary fetched.', data: summary });
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
  stockIn,
  recordUsage,
  recordWastage,
  adjustStock: adjustStockCtrl,
  transactionHistory,
  transactionSummary
};

