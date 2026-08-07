const { getDatabasePool } = require('../../config/database');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

/**
 * Create a new corporate/event catering booking
 */
async function createCateringBooking(req, res, next) {
  try {
    const pool = getDatabasePool();
    const {
      companyName,
      contactPerson,
      contactPhone,
      contactEmail,
      eventDate,
      eventTime,
      venueAddress,
      headcount,
      packageTier,
      dietaryNotes,
      paymentPlan,
      totalAmount,
      depositAmount,
      eventName,
      restaurantId
    } = req.body;

    const targetRestaurantId = restaurantId || req.user?.restaurantId || 1;
    const finalGuestName = contactPerson || req.user?.name || req.user?.email || 'Corporate Host';
    const finalEventName = eventName || `${companyName || 'Corporate'} Event Catering`;
    const finalTotal = parseFloat(totalAmount) || 0;
    const finalDeposit = parseFloat(depositAmount) || (finalTotal * 0.25);
    const paidAmount = paymentPlan === 'Full Payment' ? finalTotal : finalDeposit;
    const initialStatus = 'Confirmed / Deposit Paid';

    const [result] = await pool.execute(
      `INSERT INTO catering_installments (
        restaurant_id, guest_name, event_name, company_name, contact_person,
        contact_phone, contact_email, event_date, event_time, venue_address,
        headcount, package_tier, dietary_notes, payment_plan, total_amount,
        deposit_amount, paid_amount, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        targetRestaurantId,
        finalGuestName,
        finalEventName,
        companyName || 'N/A',
        contactPerson || finalGuestName,
        contactPhone || 'N/A',
        contactEmail || req.user?.email || 'N/A',
        eventDate || 'TBD',
        eventTime || 'TBD',
        venueAddress || 'N/A',
        parseInt(headcount) || 50,
        packageTier || 'Executive',
        dietaryNotes || '',
        paymentPlan || 'Installments',
        finalTotal,
        finalDeposit,
        paidAmount,
        initialStatus
      ]
    );

    // Sync catering booking to the main orders table so Owner, Staff & Kitchen Display see it live
    try {
      const { createOrder } = require('../order/order.service');
      const orderNumber = `CAT-${String(result.insertId).padStart(4, '0')}`;
      const guestNum = parseInt(headcount) || 1;
      const unitPrice = Math.round((finalTotal / guestNum) * 100) / 100;

      await createOrder({
        restaurantId: targetRestaurantId,
        customerName: `${companyName ? `${companyName} (${finalGuestName})` : finalGuestName}`,
        customerPhone: contactPhone || 'N/A',
        orderNumber: orderNumber,
        totalAmount: finalTotal,
        orderStatus: 'Accepted',
        paymentStatus: paymentPlan === 'Full Payment' ? 'Paid' : 'Partial',
        items: [
          {
            id: `CAT-PKG-${result.insertId}`,
            name: `${packageTier || 'Executive'} Catering Package (${guestNum} Guests)`,
            quantity: guestNum,
            price: unitPrice,
            notes: dietaryNotes || ''
          }
        ],
        fulfillmentDetails: {
          type: 'Catering',
          fulfillmentType: 'Catering',
          companyName: companyName || '',
          contactPerson: finalGuestName,
          contactEmail: contactEmail || '',
          contactPhone: contactPhone || '',
          eventDate: eventDate || '',
          eventTime: eventTime || '',
          venueAddress: venueAddress || '',
          paymentPlan: paymentPlan || 'Installments',
          cateringBookingId: result.insertId
        },
        specialInstructions: `CATERING EVENT: ${eventDate || 'TBD'} @ ${eventTime || 'TBD'}. Venue: ${venueAddress || 'N/A'}. Notes: ${dietaryNotes || 'None'}`
      });
      console.log(`[Catering] Successfully synced catering booking #${result.insertId} to main orders table as ${orderNumber}`);
    } catch (orderErr) {
      console.error('[Catering] Failed to sync catering booking into main orders table:', orderErr.message);
    }

    const [rows] = await pool.execute(
      `SELECT * FROM catering_installments WHERE id = ?`,
      [result.insertId]
    );

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Catering booking placed successfully',
      data: rows[0]
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Get catering bookings (Filtered by user for guests, all for owner/admin)
 */
async function getCateringBookings(req, res, next) {
  try {
    const pool = getDatabasePool();
    const restaurantId = req.query.restaurantId || req.user?.restaurantId || 1;
    
    // Check if requester is a guest/customer or specifically filtering my orders
    const guestEmail = req.query.email || req.query.guestEmail || (req.user?.role === 'Customer' ? req.user?.email : null);
    const myOrdersOnly = req.query.myOrdersOnly === 'true';

    let rows = [];
    if (myOrdersOnly && guestEmail) {
      const [results] = await pool.execute(
        `SELECT * FROM catering_installments 
         WHERE restaurant_id = ? AND (contact_email = ? OR guest_name LIKE ?) 
         ORDER BY created_at DESC`,
        [restaurantId, guestEmail, `%${guestEmail}%`]
      );
      rows = results;
    } else {
      const [results] = await pool.execute(
        `SELECT * FROM catering_installments WHERE restaurant_id = ? ORDER BY created_at DESC`,
        [restaurantId]
      );
      rows = results;
    }

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Catering bookings fetched successfully',
      data: rows
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Update status of a catering booking (Owner/Admin portal)
 */
async function updateCateringStatus(req, res, next) {
  try {
    const pool = getDatabasePool();
    const { id } = req.params;
    const { status, paidAmount } = req.body;

    let query = `UPDATE catering_installments SET status = ?`;
    const params = [status];

    if (paidAmount !== undefined) {
      query += `, paid_amount = ?`;
      params.push(parseFloat(paidAmount));
    }

    query += ` WHERE id = ?`;
    params.push(id);

    await pool.execute(query, params);

    // Also update order status in main orders table if exists
    try {
      const orderNumber = `CAT-${String(id).padStart(4, '0')}`;
      let mappedOrderStatus = 'Accepted';
      if (status.includes('Preparation')) mappedOrderStatus = 'Preparing';
      else if (status.includes('Delivery')) mappedOrderStatus = 'Out for Delivery';
      else if (status.includes('Completed')) mappedOrderStatus = 'Completed';
      else if (status.includes('Cancelled')) mappedOrderStatus = 'Cancelled';

      await pool.execute(
        `UPDATE orders SET order_status = ? WHERE order_number = ?`,
        [mappedOrderStatus, orderNumber]
      );
    } catch (orderErr) {
      console.error('[Catering] Status update order sync warning:', orderErr.message);
    }

    const [updated] = await pool.execute(`SELECT * FROM catering_installments WHERE id = ?`, [id]);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Catering status updated successfully',
      data: updated[0]
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createCateringBooking,
  getCateringBookings,
  updateCateringStatus
};
