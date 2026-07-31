const { getDatabasePool } = require('../../config/database');
const pool = getDatabasePool();

// --- GST-009: Guest Preference & Privacy ---

async function getGuestPreferences(req, res) {
  try {
    const userId = req.user.id;

    const [rows] = await pool.execute(
      `SELECT * FROM guest_preferences WHERE user_id = ? LIMIT 1`,
      [userId]
    );

    let prefs = rows[0];
    if (!prefs) {
      // Create default
      await pool.execute(
        `INSERT INTO guest_preferences (user_id) VALUES (?)`,
        [userId]
      );
      const [newRows] = await pool.execute(
        `SELECT * FROM guest_preferences WHERE user_id = ? LIMIT 1`,
        [userId]
      );
      prefs = newRows[0];
    }

    return res.json({ success: true, data: prefs });
  } catch (error) {
    console.error('Error fetching guest preferences:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch preferences' });
  }
}

async function updateGuestPreferences(req, res) {
  try {
    const userId = req.user.id;
    const {
      email_opt_in,
      sms_opt_in,
      whatsapp_opt_in,
      push_opt_in,
      direct_incentive_opt_in
    } = req.body;

    const [existing] = await pool.execute(
      `SELECT id FROM guest_preferences WHERE user_id = ? LIMIT 1`,
      [userId]
    );

    if (existing.length === 0) {
      await pool.execute(
        `INSERT INTO guest_preferences (user_id, email_opt_in, sms_opt_in, whatsapp_opt_in, push_opt_in, direct_incentive_opt_in)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userId,
          email_opt_in ? 1 : 0,
          sms_opt_in ? 1 : 0,
          whatsapp_opt_in ? 1 : 0,
          push_opt_in ? 1 : 0,
          direct_incentive_opt_in ? 1 : 0
        ]
      );
    } else {
      await pool.execute(
        `UPDATE guest_preferences SET
          email_opt_in = ?,
          sms_opt_in = ?,
          whatsapp_opt_in = ?,
          push_opt_in = ?,
          direct_incentive_opt_in = ?
         WHERE user_id = ?`,
        [
          email_opt_in ? 1 : 0,
          sms_opt_in ? 1 : 0,
          whatsapp_opt_in ? 1 : 0,
          push_opt_in ? 1 : 0,
          direct_incentive_opt_in ? 1 : 0,
          userId
        ]
      );
    }

    return res.json({ success: true, message: 'Privacy preferences updated successfully' });
  } catch (error) {
    console.error('Error updating guest preferences:', error);
    return res.status(500).json({ success: false, message: 'Failed to update preferences' });
  }
}

async function requestErasure(req, res) {
  try {
    const userId = req.user.id;

    await pool.execute(
      `UPDATE guest_preferences SET erasure_requested = 1, erasure_requested_at = NOW() WHERE user_id = ?`,
      [userId]
    );

    return res.json({
      success: true,
      message: 'Right-to-be-forgotten erasure request received. Personal data will be anonymized within 30 days.'
    });
  } catch (error) {
    console.error('Error processing erasure request:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit erasure request' });
  }
}

// --- OWN-030: Data Export & PII Tool ---

async function exportRestaurantData(req, res) {
  try {
    const restaurantId = req.user?.restaurant_id || 1;
    const type = req.query.type || 'all'; // menu, customers, orders, all
    const redactPii = req.query.redactPii === 'true';

    const exportBundle = {
      exportTimestamp: new Date().toISOString(),
      restaurantId,
      piiRedacted: redactPii
    };

    if (type === 'menu' || type === 'all') {
      const [categories] = await pool.execute(`SELECT * FROM menu_categories WHERE restaurant_id = ?`, [restaurantId]);
      const [items] = await pool.execute(`SELECT * FROM menu_items WHERE restaurant_id = ?`, [restaurantId]);
      exportBundle.menu = { categories, items };
    }

    if (type === 'customers' || type === 'all') {
      const [customers] = await pool.execute(
        `SELECT id, name, email, phone, total_orders, total_spent, segment, created_at FROM customers WHERE restaurant_id = ?`,
        [restaurantId]
      );

      exportBundle.customers = customers.map((c) => {
        if (redactPii) {
          return {
            id: c.id,
            name: c.name ? `${c.name[0]}***` : 'Anonymous',
            email: c.email ? `***@${c.email.split('@')[1] || 'domain.com'}` : '***',
            phone: c.phone ? `+1*****${c.phone.slice(-4)}` : '***',
            total_orders: c.total_orders,
            total_spent: c.total_spent,
            segment: c.segment,
            created_at: c.created_at
          };
        }
        return c;
      });
    }

    if (type === 'orders' || type === 'all') {
      const [orders] = await pool.execute(
        `SELECT id, order_number, total_amount, order_status AS status, payment_status, created_at FROM orders WHERE restaurant_id = ? LIMIT 100`,
        [restaurantId]
      );
      exportBundle.orders = orders;
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="restaurant-data-export-${Date.now()}.json"`);
    return res.json(exportBundle);
  } catch (error) {
    console.error('Error exporting data:', error);
    return res.status(500).json({ success: false, message: 'Failed to export data' });
  }
}

module.exports = {
  getGuestPreferences,
  updateGuestPreferences,
  requestErasure,
  exportRestaurantData
};
