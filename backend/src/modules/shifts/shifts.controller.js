const { getDatabasePool } = require('../../config/database');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

async function getOwnerShifts(req, res, next) {
  try {
    const pool = getDatabasePool();
    const restaurantId = req.user?.restaurantId || 1;
    const [rows] = await pool.execute(
      `SELECT * FROM staff_shifts WHERE restaurant_id = ? ORDER BY shift_date ASC, start_time ASC`,
      [restaurantId]
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Staff shifts fetched successfully',
      data: rows
    });
  } catch (err) {
    return next(err);
  }
}

async function createShift(req, res, next) {
  try {
    const pool = getDatabasePool();
    const restaurantId = req.user?.restaurantId || 1;
    const { staffId, staffName, role, shiftDate, startTime, endTime, isOpenShift } = req.body;

    const nameToSave = isOpenShift ? 'Open Shift' : (staffName || 'Staff Member');
    const isopen = Boolean(isOpenShift);
    const statusVal = isopen ? 'Open' : 'Scheduled';

    const [result] = await pool.execute(
      `INSERT INTO staff_shifts (restaurant_id, staff_id, staff_name, role, shift_date, start_time, end_time, is_open_shift, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [restaurantId, staffId || null, nameToSave, role || 'Kitchen', shiftDate, startTime, endTime, isopen, statusVal]
    );

    const [rows] = await pool.execute(`SELECT * FROM staff_shifts WHERE id = ?`, [result.insertId]);

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Staff shift created successfully',
      data: rows[0]
    });
  } catch (err) {
    return next(err);
  }
}

async function getOpenShifts(req, res, next) {
  try {
    const pool = getDatabasePool();
    const restaurantId = req.user?.restaurantId || 1;
    const [rows] = await pool.execute(
      `SELECT * FROM staff_shifts WHERE restaurant_id = ? AND (is_open_shift = TRUE OR status = 'Open') ORDER BY shift_date ASC`,
      [restaurantId]
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Open shifts fetched successfully',
      data: rows
    });
  } catch (err) {
    return next(err);
  }
}

async function claimShift(req, res, next) {
  try {
    const pool = getDatabasePool();
    const shiftId = req.params.id;
    const staffName = req.body.staffName || req.user?.name || 'Assigned Staff';
    const staffId = req.user?.id || 1;

    const [existing] = await pool.execute(`SELECT * FROM staff_shifts WHERE id = ?`, [shiftId]);
    if (existing.length === 0) {
      return sendError(res, { statusCode: 404, message: 'Shift not found.' });
    }

    await pool.execute(
      `UPDATE staff_shifts SET staff_id = ?, staff_name = ?, is_open_shift = FALSE, status = 'Claimed' WHERE id = ?`,
      [staffId, staffName, shiftId]
    );

    const [updated] = await pool.execute(`SELECT * FROM staff_shifts WHERE id = ?`, [shiftId]);

    return sendSuccess(res, {
      statusCode: 200,
      message: '🎉 Open shift claimed successfully!',
      data: updated[0]
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getOwnerShifts,
  createShift,
  getOpenShifts,
  claimShift
};
