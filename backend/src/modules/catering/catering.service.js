const { getDatabasePool } = require('../../config/database');

/**
 * Create a new catering inquiry/booking
 */
async function createCateringRequest(data) {
  const pool = getDatabasePool();

  // Look up restaurant name
  let restaurantName = '';
  try {
    const [rRows] = await pool.execute('SELECT name FROM restaurants WHERE id = ?', [data.restaurantId]);
    restaurantName = rRows[0]?.name || '';
  } catch (e) { /* ignore */ }

  const [result] = await pool.execute(
    `INSERT INTO catering_orders
      (restaurant_id, restaurant_name, company_name, contact_person, contact_phone, contact_email,
       event_name, event_date, event_time, venue_address, headcount, package_tier,
       menu_items, dietary_notes, total_amount, deposit_amount, paid_amount, payment_plan, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'New Inquiry')`,
    [
      data.restaurantId,
      restaurantName,
      data.companyName,
      data.contactPerson,
      data.contactPhone,
      data.contactEmail,
      data.eventName || '',
      data.eventDate,
      data.eventTime || '12:00',
      data.venueAddress,
      data.headcount || 20,
      data.packageTier || 'Executive',
      data.menuItems ? JSON.stringify(data.menuItems) : null,
      data.dietaryNotes || '',
      data.totalAmount || 0,
      data.depositAmount || 0,
      0,
      data.paymentPlan || 'Installments'
    ]
  );

  // Send notification to restaurant owner
  try {
    const { createNotification } = require('../notification/notification.service');
    await createNotification({
      restaurantId: data.restaurantId,
      title: '🍽️ New Catering Inquiry',
      message: `${data.companyName} requested catering for ${data.headcount} guests on ${data.eventDate}. Contact: ${data.contactPerson} (${data.contactPhone})`,
      type: 'Catering',
      isRead: false
    });
  } catch (e) {
    console.error('[Catering] Notification send failed:', e.message);
  }

  const [rows] = await pool.execute('SELECT * FROM catering_orders WHERE id = ?', [result.insertId]);
  return rows[0];
}

/**
 * Get catering orders by guest email (public, no auth)
 */
async function getOrdersByEmail(email) {
  const pool = getDatabasePool();
  const [rows] = await pool.execute(
    'SELECT * FROM catering_orders WHERE contact_email = ? ORDER BY created_at DESC',
    [email]
  );
  return rows;
}

/**
 * Get all catering orders for a restaurant (owner/admin)
 */
async function getOrdersByRestaurant(restaurantId) {
  const pool = getDatabasePool();
  const [rows] = await pool.execute(
    'SELECT * FROM catering_orders WHERE restaurant_id = ? ORDER BY created_at DESC',
    [restaurantId]
  );
  return rows;
}

/**
 * Get confirmed & in-preparation catering orders for staff
 */
async function getStaffCateringEvents(restaurantId) {
  const pool = getDatabasePool();
  const [rows] = await pool.execute(
    `SELECT * FROM catering_orders
     WHERE restaurant_id = ? AND status IN ('Confirmed', 'In Preparation', 'Ready for Dispatch')
     ORDER BY event_date ASC, event_time ASC`,
    [restaurantId]
  );
  return rows;
}

/**
 * Update catering order status
 */
async function updateStatus(id, status, ownerNotes) {
  const pool = getDatabasePool();
  let query = 'UPDATE catering_orders SET status = ?';
  const params = [status];

  if (ownerNotes !== undefined && ownerNotes !== null) {
    query += ', owner_notes = ?';
    params.push(ownerNotes);
  }

  // If confirmed, mark deposit as paid
  if (status === 'Confirmed') {
    query += ', paid_amount = deposit_amount';
  }

  query += ' WHERE id = ?';
  params.push(id);

  await pool.execute(query, params);
  const [rows] = await pool.execute('SELECT * FROM catering_orders WHERE id = ?', [id]);
  return rows[0];
}

/**
 * Update owner notes only
 */
async function updateNotes(id, notes) {
  const pool = getDatabasePool();
  await pool.execute('UPDATE catering_orders SET owner_notes = ? WHERE id = ?', [notes, id]);
  const [rows] = await pool.execute('SELECT * FROM catering_orders WHERE id = ?', [id]);
  return rows[0];
}

/**
 * Get summary counts for a restaurant
 */
async function getSummaryCounts(restaurantId) {
  const pool = getDatabasePool();
  const [rows] = await pool.execute(
    `SELECT status, COUNT(*) as count FROM catering_orders WHERE restaurant_id = ? GROUP BY status`,
    [restaurantId]
  );
  const counts = { 'New Inquiry': 0, 'Confirmed': 0, 'In Preparation': 0, 'Ready for Dispatch': 0, 'Delivered': 0, 'Completed': 0, 'Declined': 0, 'Cancelled': 0 };
  rows.forEach(r => { counts[r.status] = r.count; });
  return counts;
}

module.exports = {
  createCateringRequest,
  getOrdersByEmail,
  getOrdersByRestaurant,
  getStaffCateringEvents,
  updateStatus,
  updateNotes,
  getSummaryCounts
};
