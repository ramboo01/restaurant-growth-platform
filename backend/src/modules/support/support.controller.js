const { getDatabasePool } = require('../../config/database');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

async function createOwnerTicket(req, res, next) {
  try {
    const pool = getDatabasePool();
    const { subject, category, priority, message, restaurant_id } = req.body;

    if (!subject || !message) {
      return sendError(res, { statusCode: 400, message: 'Subject and detailed message are required.' });
    }

    const userId = req.user?.id || 1;
    const userName = req.user?.name || 'Restaurant Owner';
    const userEmail = req.user?.email || 'owner@example.com';

    let restaurantName = 'General Store';
    if (restaurant_id) {
      const [[resto]] = await pool.execute('SELECT name FROM restaurants WHERE id = ?', [restaurant_id]).catch(() => [[null]]);
      if (resto) restaurantName = resto.name;
    } else {
      const [[resto]] = await pool.execute('SELECT name FROM restaurants LIMIT 1').catch(() => [[null]]);
      if (resto) restaurantName = resto.name;
    }

    // Generate unique ticket number
    const [[maxRow]] = await pool.execute('SELECT MAX(id) as maxId FROM support_tickets').catch(() => [[{ maxId: 0 }]]);
    const nextId = (maxRow?.maxId || 0) + 101;
    const ticketNumber = `TKT-${nextId}`;

    await pool.execute(
      `INSERT INTO support_tickets (ticket_number, restaurant_id, restaurant_name, user_id, user_name, user_email, subject, category, priority, status, message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Open', ?)`,
      [
        ticketNumber,
        restaurant_id || null,
        restaurantName,
        userId,
        userName,
        userEmail,
        subject,
        category || 'General Inquiry',
        priority || 'Medium',
        message
      ]
    );

    // Audit log
    await pool.execute(
      `INSERT INTO platform_audit_logs (user_id, user_role, action_type, description)
       VALUES (?, 'Owner', 'SUPPORT_TICKET_CREATED', ?)`,
      [userId, `Submitted support ticket ${ticketNumber}: "${subject}" for ${restaurantName}`]
    ).catch(() => {});

    return sendSuccess(res, {
      statusCode: 201,
      message: `🎉 Support ticket ${ticketNumber} created successfully! Our team will respond shortly.`
    });
  } catch (err) {
    return next(err);
  }
}

async function getOwnerTickets(req, res, next) {
  try {
    const pool = getDatabasePool();
    const userId = req.user?.id || 1;

    const [rows] = await pool.execute(
      `SELECT * FROM support_tickets WHERE user_id = ? OR user_email = ? ORDER BY created_at DESC`,
      [userId, req.user?.email || '']
    ).catch(async () => {
      // Fallback: Return all tickets if single user check fails
      return pool.execute(`SELECT * FROM support_tickets ORDER BY created_at DESC`);
    });

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Owner support tickets fetched successfully',
      data: rows
    });
  } catch (err) {
    return next(err);
  }
}

async function getAdminTickets(req, res, next) {
  try {
    const pool = getDatabasePool();
    const [rows] = await pool.execute(`SELECT * FROM support_tickets ORDER BY created_at DESC`);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Admin support tickets fetched successfully',
      data: rows
    });
  } catch (err) {
    return next(err);
  }
}

async function respondAndResolveTicket(req, res, next) {
  try {
    const pool = getDatabasePool();
    const { ticket_id, admin_response, status } = req.body;

    if (!ticket_id) {
      return sendError(res, { statusCode: 400, message: 'Ticket ID is required.' });
    }

    const newStatus = status || 'Resolved';

    await pool.execute(
      `UPDATE support_tickets 
       SET admin_response = ?, status = ?, resolved_at = IF(? = 'Resolved', NOW(), resolved_at) 
       WHERE id = ?`,
      [admin_response || 'Issue investigated and resolved by support team.', newStatus, newStatus, ticket_id]
    );

    // Audit log
    await pool.execute(
      `INSERT INTO platform_audit_logs (user_id, user_role, action_type, description)
       VALUES (?, 'Admin', 'SUPPORT_TICKET_RESOLVED', ?)`,
      [req.user?.id || 1, `Admin responded & updated support ticket #${ticket_id} to status "${newStatus}"`]
    ).catch(() => {});

    return sendSuccess(res, {
      statusCode: 200,
      message: `🎉 Support ticket updated to ${newStatus} with admin response!`
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createOwnerTicket,
  getOwnerTickets,
  getAdminTickets,
  respondAndResolveTicket
};
