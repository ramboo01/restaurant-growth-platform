const { getDatabasePool } = require('../../config/database');

async function getReviews(restaurantId) {
  const pool = getDatabasePool();
  const [rows] = await pool.execute(
    `SELECT id, restaurant_id AS restaurantId, customer_name AS customerName, platform, rating, content, ai_reply_draft AS aiReplyDraft, reply_status AS replyStatus, created_at AS createdAt 
     FROM customer_reviews 
     WHERE restaurant_id = ? 
     ORDER BY created_at DESC`,
    [restaurantId]
  );
  return rows;
}

async function updateReview(id, restaurantId, updates) {
  const pool = getDatabasePool();
  const setClauses = [];
  const params = [];
  
  if (updates.aiReplyDraft !== undefined) {
    setClauses.push('ai_reply_draft = ?');
    params.push(updates.aiReplyDraft);
  }
  
  if (updates.replyStatus !== undefined) {
    setClauses.push('reply_status = ?');
    params.push(updates.replyStatus);
  }

  if (setClauses.length === 0) return null;

  params.push(id, restaurantId);

  await pool.execute(
    `UPDATE customer_reviews SET ${setClauses.join(', ')} WHERE id = ? AND restaurant_id = ?`,
    params
  );

  const [rows] = await pool.execute(
    `SELECT id, restaurant_id AS restaurantId, customer_name AS customerName, platform, rating, content, ai_reply_draft AS aiReplyDraft, reply_status AS replyStatus, created_at AS createdAt 
     FROM customer_reviews 
     WHERE id = ?`,
    [id]
  );
  return rows[0];
}

async function generateAiReply(id, restaurantId) {
  const pool = getDatabasePool();
  const [rows] = await pool.execute(
    `SELECT * FROM customer_reviews WHERE id = ? AND restaurant_id = ?`,
    [id, restaurantId]
  );
  if (rows.length === 0) throw new Error('Review not found');
  
  const review = rows[0];
  let draft = '';
  
  if (review.rating >= 4) {
    draft = `Hi ${review.customer_name},\n\nThank you so much for the ${review.rating}-star review on ${review.platform}! We are thrilled you enjoyed your experience. Looking forward to serving you again soon.\n\nBest,\nThe Management`;
  } else if (review.rating === 3) {
    draft = `Hi ${review.customer_name},\n\nThank you for sharing your feedback on ${review.platform}. We always aim for a 5-star experience, and it looks like we fell a bit short this time. We would love to hear more about how we can improve.\n\nBest,\nThe Management`;
  } else {
    draft = `Dear ${review.customer_name},\n\nWe sincerely apologize that your recent experience did not meet expectations. We take this feedback seriously and would like to make things right. Please contact us directly so we can resolve this.\n\nSincerely,\nThe Management`;
  }
  
  await updateReview(id, restaurantId, { aiReplyDraft: draft });
  return draft;
}

module.exports = {
  getReviews,
  updateReview,
  generateAiReply
};
