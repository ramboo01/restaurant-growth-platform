const { getDatabasePool } = require('../../config/database');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

async function getChannels(req, res, next) {
  try {
    const pool = getDatabasePool();
    const [rows] = await pool.execute(`SELECT * FROM channel_sync_status ORDER BY id ASC`);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Channel sync statuses fetched successfully',
      data: rows
    });
  } catch (err) {
    return next(err);
  }
}

async function forceSyncChannel(req, res, next) {
  try {
    const pool = getDatabasePool();
    const { id } = req.body;
    await pool.execute(
      `UPDATE channel_sync_status SET last_synced_at = NOW(), status = 'Active' WHERE id = ?`,
      [id]
    );
    const [updated] = await pool.execute(`SELECT * FROM channel_sync_status WHERE id = ?`, [id]);
    return sendSuccess(res, {
      statusCode: 200,
      message: '🎉 Channel synchronization triggered and updated live!',
      data: updated[0]
    });
  } catch (err) {
    return next(err);
  }
}

async function getFranchiseApplications(req, res, next) {
  try {
    const pool = getDatabasePool();
    const [rows] = await pool.execute(`SELECT * FROM franchise_applications ORDER BY submitted_at DESC`);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Franchise applications fetched successfully',
      data: rows
    });
  } catch (err) {
    return next(err);
  }
}

async function handleFranchiseAppAction(req, res, next) {
  try {
    const pool = getDatabasePool();
    const { id, action } = req.body;
    await pool.execute(`UPDATE franchise_applications SET status = ? WHERE id = ?`, [action, id]);
    const [updated] = await pool.execute(`SELECT * FROM franchise_applications WHERE id = ?`, [id]);
    return sendSuccess(res, {
      statusCode: 200,
      message: `🎉 Franchise application ${action.toLowerCase()}!`,
      data: updated[0]
    });
  } catch (err) {
    return next(err);
  }
}

async function requestInstantPayout(req, res, next) {
  try {
    const pool = getDatabasePool();
    const { staffName, tipsEarned, basePay } = req.body;
    const tips = Number(tipsEarned || 45.00);
    const base = Number(basePay || 95.00);
    const total = tips + base;
    const today = new Date().toISOString().split('T')[0];

    const [result] = await pool.execute(
      `INSERT INTO staff_instant_payouts (staff_name, shift_date, tips_earned, base_pay, total_payout, status)
       VALUES (?, ?, ?, ?, ?, 'Paid')`,
      [staffName || 'Staff Member', today, tips, base, total]
    );

    const [rows] = await pool.execute(`SELECT * FROM staff_instant_payouts WHERE id = ?`, [result.insertId]);

    return sendSuccess(res, {
      statusCode: 201,
      message: `🎉 Instant payout of $${total.toFixed(2)} disbursed to your account!`,
      data: rows[0]
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getChannels,
  forceSyncChannel,
  getFranchiseApplications,
  handleFranchiseAppAction,
  requestInstantPayout
};
