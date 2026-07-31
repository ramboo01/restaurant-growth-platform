const { queryAiCopilot } = require('./ai.service');
const { sendSuccess } = require('../../utils/apiResponse');
const { getAuthenticatedRestaurantId } = require('../../utils/restaurantScope');

async function handleCopilotQuery(request, response, next) {
  try {
    const restaurantId = getAuthenticatedRestaurantId(request);
    const { query } = request.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return response.status(400).json({
        success: false,
        message: 'Query text is required.'
      });
    }

    const result = await queryAiCopilot(restaurantId, query.trim());
    return sendSuccess(response, {
      statusCode: 200,
      message: 'AI Operations query processed successfully.',
      data: result
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  handleCopilotQuery
};
