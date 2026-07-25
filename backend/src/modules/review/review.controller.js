const reviewService = require('./review.service');

async function getReviewsHandler(req, res) {
  try {
    const restaurantId = req.user.restaurantId || 1;
    const reviews = await reviewService.getReviews(restaurantId);
    res.json({ success: true, data: reviews });
  } catch (error) {
    console.error('getReviewsHandler error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function updateReviewHandler(req, res) {
  try {
    const restaurantId = req.user.restaurantId || 1;
    const { id } = req.params;
    const updates = req.body;
    const updated = await reviewService.updateReview(id, restaurantId, updates);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('updateReviewHandler error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function generateAiReplyHandler(req, res) {
  try {
    const restaurantId = req.user.restaurantId || 1;
    const { id } = req.params;
    const draft = await reviewService.generateAiReply(id, restaurantId);
    res.json({ success: true, data: { draft } });
  } catch (error) {
    console.error('generateAiReplyHandler error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = {
  getReviewsHandler,
  updateReviewHandler,
  generateAiReplyHandler
};
