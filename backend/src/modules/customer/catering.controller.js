const { getDatabasePool } = require('../../config/database');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

async function createCateringBooking(req, res, next) {
  try {
    const pool = getDatabasePool();
    const { eventName, totalAmount, depositAmount, guestName } = req.body;
    const restaurantId = req.body.restaurantId || req.user?.restaurantId || 1;
    const name = guestName || req.user?.name || 'Guest User';

    const [result] = await pool.execute(
      `INSERT INTO catering_installments (restaurant_id, guest_name, event_name, total_amount, deposit_amount, paid_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, 'In Progress')`,
      [restaurantId, name, eventName || 'Catering Event', totalAmount, depositAmount, depositAmount]
    );

    const [rows] = await pool.execute(
      `SELECT * FROM catering_installments WHERE id = ?`,
      [result.insertId]
    );

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Catering installment booking created successfully',
      data: rows[0]
    });
  } catch (err) {
    return next(err);
  }
}

async function getCateringBookings(req, res, next) {
  try {
    const pool = getDatabasePool();
    const restaurantId = req.user?.restaurantId || 1;
    const [rows] = await pool.execute(
      `SELECT * FROM catering_installments WHERE restaurant_id = ? ORDER BY created_at DESC`,
      [restaurantId]
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Catering installment bookings fetched successfully',
      data: rows
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createCateringBooking,
  getCateringBookings
};
