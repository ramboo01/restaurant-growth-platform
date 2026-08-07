const franchiseService = require('./franchise.service');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

async function getMyRestaurants(request, response, next) {
  try {
    const userId = request.user?.sub || request.user?.id;
    const restaurants = await franchiseService.getRestaurantsForUser(userId);
    return sendSuccess(response, {
      statusCode: 200,
      message: 'User restaurants fetched successfully.',
      data: { restaurants }
    });
  } catch (error) {
    return next(error);
  }
}

async function updateStatus(request, response, next) {
  try {
    const { restaurantId } = request.params;
    const { status } = request.body;
    await franchiseService.updateRestaurantStatus(restaurantId, status);
    return sendSuccess(response, {
      statusCode: 200,
      message: `Restaurant status updated to '${status}'.`,
      data: { restaurantId, status }
    });
  } catch (error) {
    return next(error);
  }
}

async function getSettings(request, response, next) {
  try {
    const userId = request.user?.sub || request.user?.id;
    const settings = await franchiseService.getFranchiseSettings(userId);
    return sendSuccess(response, {
      statusCode: 200,
      message: 'Franchise settings fetched.',
      data: settings
    });
  } catch (error) {
    return next(error);
  }
}

async function saveSettings(request, response, next) {
  try {
    const userId = request.user?.sub || request.user?.id;
    const saved = await franchiseService.saveFranchiseSettings(userId, request.body);
    return sendSuccess(response, {
      statusCode: 200,
      message: 'Franchise settings saved successfully.',
      data: saved
    });
  } catch (error) {
    return next(error);
  }
}

async function syncMenu(request, response, next) {
  try {
    const userId = request.user?.sub || request.user?.id;
    const sourceRestaurantId = request.body.sourceRestaurantId || request.restaurantId;
    const result = await franchiseService.syncMenuAcrossRestaurants(userId, sourceRestaurantId);
    return sendSuccess(response, {
      statusCode: 200,
      message: result.message,
      data: result
    });
  } catch (error) {
    return next(error);
  }
}

async function switchRestaurant(request, response, next) {
  try {
    const userId = request.user?.sub || request.user?.id;
    const { restaurantId } = request.body;

    const hasAccess = await franchiseService.userHasAccessToRestaurant(userId, restaurantId);
    if (!hasAccess) {
      return sendError(response, {
        statusCode: 403,
        message: 'You do not have access to this restaurant.'
      });
    }

    return sendSuccess(response, {
      statusCode: 200,
      message: 'Restaurant switched successfully.',
      data: { activeRestaurantId: restaurantId }
    });
  } catch (error) {
    return next(error);
  }
}

async function getFinancialSettings(request, response, next) {
  try {
    const restaurantId = request.restaurantId || request.user?.restaurantId || 1;
    const settings = await franchiseService.getFinancialSettings(restaurantId);
    return sendSuccess(response, {
      statusCode: 200,
      message: 'Financial settings fetched successfully.',
      data: settings
    });
  } catch (error) {
    return next(error);
  }
}

async function saveFinancialSettings(request, response, next) {
  try {
    const restaurantId = request.restaurantId || request.user?.restaurantId || 1;
    const saved = await franchiseService.saveFinancialSettings(restaurantId, request.body);
    return sendSuccess(response, {
      statusCode: 200,
      message: 'Financial settings saved successfully.',
      data: saved
    });
  } catch (error) {
    return next(error);
  }
}

async function getCateringInstallments(request, response, next) {
  try {
    const restaurantId = request.restaurantId || request.user?.restaurantId || 1;
    const installments = await franchiseService.getCateringInstallments(restaurantId);
    return sendSuccess(response, {
      statusCode: 200,
      message: 'Catering installments fetched successfully.',
      data: installments
    });
  } catch (error) {
    return next(error);
  }
}

async function getFranchiseComparison(request, response, next) {
  try {
    const userId = request.user?.sub || request.user?.id;
    const comparison = await franchiseService.getFranchiseComparisonData(userId);
    return sendSuccess(response, {
      statusCode: 200,
      message: 'Franchise comparison fetched successfully.',
      data: comparison
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getMyRestaurants,
  updateStatus,
  getSettings,
  saveSettings,
  syncMenu,
  switchRestaurant,
  getFinancialSettings,
  saveFinancialSettings,
  getCateringInstallments,
  getFranchiseComparison
};
