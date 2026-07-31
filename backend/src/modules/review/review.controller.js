const reviewService = require('./review.service');
const { createCustomerNotification } = require('../customerNotification/customerNotification.service');

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

    // When the owner publishes a reply, notify the customer in real-time
    if (updates.replyStatus === 'Replied' && updated) {
      try {
        // 1. Fetch the full review to get the original reviewer's user_id if linked
        const { getDatabasePool } = require('../../config/database');
        const pool = getDatabasePool();
        const [reviewRows] = await pool.execute(
          `SELECT user_id, customer_name FROM customer_reviews WHERE id = ?`,
          [id]
        );
        const review = reviewRows[0];

        // Only notify if the review was submitted by a registered user
        if (review && review.user_id) {
          const notification = await createCustomerNotification({
            userId: review.user_id,
            restaurantId,
            type: 'review_reply',
            title: 'The restaurant replied to your review!',
            message: updated.aiReplyDraft
              ? `"${updated.aiReplyDraft.slice(0, 120)}..."`
              : 'The restaurant has responded to your recent feedback. Check it out!'
          });

          // Emit to the customer's personal socket room
          const socketUtils = require('../../utils/socket');
          const io = socketUtils.getIO();
          io.to(`user_${review.user_id}`).emit('customerNotification', notification);
        }
      } catch (notifErr) {
        console.error('[Notification] Failed to send review reply notification:', notifErr.message);
      }
    }

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

