const { getDatabasePool } = require('../../config/database');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

async function getFranchiseComplianceData(req, res, next) {
  try {
    const pool = getDatabasePool();
    const restaurantId = req.user?.restaurantId || 1;

    const [scores] = await pool.execute(
      `SELECT * FROM franchise_compliance WHERE restaurant_id = ?`,
      [restaurantId]
    );

    const [overrides] = await pool.execute(
      `SELECT * FROM price_override_requests WHERE restaurant_id = ? ORDER BY requested_at DESC`,
      [restaurantId]
    );

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Franchise compliance data fetched successfully',
      data: {
        scorecard: scores[0] || {
          food_safety_score: 98,
          brand_standard_score: 96,
          speed_score: 94,
          review_score: 4.85,
          audit_status: 'Compliant'
        },
        overrideRequests: overrides
      }
    });
  } catch (err) {
    return next(err);
  }
}

async function handlePriceOverrideAction(req, res, next) {
  try {
    const pool = getDatabasePool();
    const { id, action } = req.body; // action: 'Approved' | 'Rejected'
    if (!id || !action) {
      return sendError(res, { statusCode: 400, message: 'ID and action are required.' });
    }

    await pool.execute(
      `UPDATE price_override_requests SET status = ? WHERE id = ?`,
      [action, id]
    );

    const [updated] = await pool.execute(
      `SELECT * FROM price_override_requests WHERE id = ?`,
      [id]
    );

    return sendSuccess(res, {
      statusCode: 200,
      message: `Price override request ${action.toLowerCase()} successfully!`,
      data: updated[0]
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getFranchiseComplianceData,
  handlePriceOverrideAction
};
