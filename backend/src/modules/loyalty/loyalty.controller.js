const {
  createLoyaltyMember,
  getLoyaltyMembers,
  getLoyaltyMemberById,
  getLoyaltyMembersByRestaurantId,
  updateLoyaltyMember,
  deleteLoyaltyMember
} = require('./loyalty.service');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

async function create(request, response, next) {
  try {
    const loyaltyMember = await createLoyaltyMember(request.body);
    return sendSuccess(response, { statusCode: 201, message: 'Loyalty member created successfully.', data: { loyaltyMember } });
  } catch (error) {
    return next(error);
  }
}

async function list(request, response, next) {
  try {
    const loyaltyMembers = await getLoyaltyMembers();
    return sendSuccess(response, { statusCode: 200, message: 'Loyalty members fetched successfully.', data: { loyaltyMembers } });
  } catch (error) {
    return next(error);
  }
}

async function getById(request, response, next) {
  try {
    const loyaltyMember = await getLoyaltyMemberById(request.params.id);
    if (!loyaltyMember) {
      return sendError(response, { statusCode: 404, message: 'Loyalty member not found.' });
    }

    return sendSuccess(response, { statusCode: 200, message: 'Loyalty member fetched successfully.', data: { loyaltyMember } });
  } catch (error) {
    return next(error);
  }
}

async function update(request, response, next) {
  try {
    const loyaltyMember = await updateLoyaltyMember(request.params.id, request.body);
    if (!loyaltyMember) {
      return sendError(response, { statusCode: 404, message: 'Loyalty member not found.' });
    }

    return sendSuccess(response, { statusCode: 200, message: 'Loyalty member updated successfully.', data: { loyaltyMember } });
  } catch (error) {
    return next(error);
  }
}

async function remove(request, response, next) {
  try {
    const deleted = await deleteLoyaltyMember(request.params.id);
    if (!deleted) {
      return sendError(response, { statusCode: 404, message: 'Loyalty member not found.' });
    }

    return sendSuccess(response, { statusCode: 200, message: 'Loyalty member deleted successfully.', data: {} });
  } catch (error) {
    return next(error);
  }
}

async function listByRestaurant(request, response, next) {
  try {
    const loyaltyMembers = await getLoyaltyMembersByRestaurantId(request.params.restaurantId);
    return sendSuccess(response, { statusCode: 200, message: 'Restaurant loyalty members fetched successfully.', data: { loyaltyMembers } });
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
  getSummary,
  listRewards,
  addReward,
  editReward,
  removeReward
};

async function getSummary(request, response, next) {
  try {
    const restaurantId = request.user.restaurantId;
    const summary = await require('./loyalty.service').getDashboardSummary(restaurantId);
    return sendSuccess(response, { statusCode: 200, message: 'Loyalty summary fetched successfully.', data: summary });
  } catch (error) {
    return next(error);
  }
}

async function listRewards(request, response, next) {
  try {
    const restaurantId = request.user.restaurantId;
    const rewards = await require('./loyalty.service').getRewards(restaurantId);
    return sendSuccess(response, { statusCode: 200, message: 'Rewards fetched successfully.', data: rewards });
  } catch (error) {
    return next(error);
  }
}

async function addReward(request, response, next) {
  try {
    const restaurantId = request.user.restaurantId;
    const reward = await require('./loyalty.service').createReward(restaurantId, request.body);
    return sendSuccess(response, { statusCode: 201, message: 'Reward created successfully.', data: reward });
  } catch (error) {
    return next(error);
  }
}

async function editReward(request, response, next) {
  try {
    const restaurantId = request.user.restaurantId;
    const reward = await require('./loyalty.service').updateReward(restaurantId, request.params.id, request.body);
    return sendSuccess(response, { statusCode: 200, message: 'Reward updated successfully.', data: reward });
  } catch (error) {
    return next(error);
  }
}

async function removeReward(request, response, next) {
  try {
    const restaurantId = request.user.restaurantId;
    await require('./loyalty.service').deleteReward(restaurantId, request.params.id);
    return sendSuccess(response, { statusCode: 200, message: 'Reward deleted successfully.', data: {} });
  } catch (error) {
    return next(error);
  }
}
