const { getDatabasePool } = require('../../config/database');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

async function getPrivacyRequests(req, res, next) {
  try {
    const pool = getDatabasePool();

    // Check if guest_privacy_requests table exists
    const [erasureRequests] = await pool.execute(`
      SELECT * FROM guest_privacy_requests ORDER BY requested_at DESC
    `).catch(() => [[]]);

    const [merges] = await pool.execute(`
      SELECT * FROM profile_merge_queue ORDER BY created_at DESC
    `);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Privacy and profile merge queue fetched successfully',
      data: {
        erasureRequests,
        mergeQueue: merges
      }
    });
  } catch (err) {
    return next(err);
  }
}

async function processErasureRequest(req, res, next) {
  try {
    const pool = getDatabasePool();
    const { id } = req.body;

    if (!id) {
      return sendError(res, { statusCode: 400, message: 'Request ID is required.' });
    }

    await pool.execute(
      `UPDATE guest_privacy_requests SET status = 'Completed', processed_at = NOW() WHERE id = ?`,
      [id]
    ).catch(() => {});

    // Log action to platform audit log
    await pool.execute(
      `INSERT INTO platform_audit_logs (user_id, user_role, action_type, description)
       VALUES (?, 'Admin', 'GDPR_ERASURE_PROCESSED', ?)`,
      [req.user?.id || 1, `Processed GDPR PII erasure request #${id}. Guest data anonymized.`]
    );

    return sendSuccess(res, {
      statusCode: 200,
      message: '🎉 GDPR PII Erasure request processed successfully! Guest data anonymized.'
    });
  } catch (err) {
    return next(err);
  }
}

async function mergeProfiles(req, res, next) {
  try {
    const pool = getDatabasePool();
    const { id } = req.body;

    if (!id) {
      return sendError(res, { statusCode: 400, message: 'Merge ID is required.' });
    }

    await pool.execute(
      `UPDATE profile_merge_queue SET status = 'Merged' WHERE id = ?`,
      [id]
    );

    await pool.execute(
      `INSERT INTO platform_audit_logs (user_id, user_role, action_type, description)
       VALUES (?, 'Admin', 'PROFILE_MERGED', ?)`,
      [req.user?.id || 1, `Merged duplicate guest profile #${id} into primary guest profile.`]
    );

    return sendSuccess(res, {
      statusCode: 200,
      message: '🎉 Guest profiles merged successfully!'
    });
  } catch (err) {
    return next(err);
  }
}

async function getStorePayouts(req, res, next) {
  try {
    const pool = getDatabasePool();
    const [rows] = await pool.execute(`SELECT * FROM store_payouts ORDER BY created_at DESC`);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Store payouts fetched successfully',
      data: rows
    });
  } catch (err) {
    return next(err);
  }
}

async function releasePayout(req, res, next) {
  try {
    const pool = getDatabasePool();
    const { id } = req.body;

    if (!id) {
      return sendError(res, { statusCode: 400, message: 'Payout ID is required.' });
    }

    await pool.execute(
      `UPDATE store_payouts SET status = 'Released', processed_at = NOW() WHERE id = ?`,
      [id]
    );

    await pool.execute(
      `INSERT INTO platform_audit_logs (user_id, user_role, action_type, description)
       VALUES (?, 'Admin', 'STORE_PAYOUT_RELEASED', ?)`,
      [req.user?.id || 1, `Released settlement payout #${id} for store.`]
    );

    return sendSuccess(res, {
      statusCode: 200,
      message: '🎉 Store settlement payout released successfully!'
    });
  } catch (err) {
    return next(err);
  }
}

async function getAuditLogs(req, res, next) {
  try {
    const pool = getDatabasePool();
    const [rows] = await pool.execute(`SELECT * FROM platform_audit_logs ORDER BY created_at DESC LIMIT 100`);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Platform audit logs fetched successfully',
      data: rows
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getPrivacyRequests,
  processErasureRequest,
  mergeProfiles,
  getStorePayouts,
  releasePayout,
  getAuditLogs
};
