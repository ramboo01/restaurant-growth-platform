const { getDashboardAnalytics } = require('./analytics.service');
const { sendSuccess } = require('../../utils/apiResponse');

async function dashboard(request, response, next) {
  try {
    const analytics = await getDashboardAnalytics(request.user.restaurantId);
    return sendSuccess(response, {
      statusCode: 200,
      message: 'Dashboard analytics fetched successfully.',
      data: analytics
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  dashboard
};
