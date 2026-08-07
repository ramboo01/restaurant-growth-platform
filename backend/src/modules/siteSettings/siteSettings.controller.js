const { getDatabasePool } = require('../../config/database');
const { getIO } = require('../../utils/socket');

async function getPublicSiteSettings(req, res) {
  try {
    const pool = getDatabasePool();
    const restaurantId = req.query.restaurant_id || 1;
    const [rows] = await pool.execute(
      `SELECT hero_title, hero_subtitle, hero_image_url, banner_text, banner_enabled, primary_color, secondary_color, announcement_ticker, store_hours, updated_at FROM site_settings WHERE restaurant_id = ? LIMIT 1`,
      [restaurantId]
    );

    const settings = rows[0] || {
      hero_title: 'Delicious Food Delivered Straight To Your Door',
      hero_subtitle: 'Freshly prepared, responsibly sourced, and lightning fast.',
      hero_image_url: '',
      banner_text: '🎉 Special Offer: Order direct & save 15% on your first meal! Code: DIRECT15',
      banner_enabled: 1,
      primary_color: '#e91e8c',
      secondary_color: '#667eea',
      announcement_ticker: '🚚 Free delivery on orders over $30 | ⏱️ Avg Delivery Time: 25 Mins',
      store_hours: 'Mon - Sun: 10:00 AM - 11:00 PM'
    };

    return res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching public site settings:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch site settings' });
  }
}

async function getOwnerSiteSettings(req, res) {
  try {
    const pool = getDatabasePool();
    const restaurantId = req.user?.restaurant_id || 1;
    const [rows] = await pool.execute(
      `SELECT * FROM site_settings WHERE restaurant_id = ? LIMIT 1`,
      [restaurantId]
    );

    const settings = rows[0] || {};
    return res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching owner site settings:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch site settings' });
  }
}

async function updateSiteSettings(req, res) {
  try {
    const pool = getDatabasePool();
    const restaurantId = req.user?.restaurant_id || 1;
    const {
      hero_title,
      hero_subtitle,
      hero_image_url,
      banner_text,
      banner_enabled,
      primary_color,
      secondary_color,
      announcement_ticker,
      store_hours
    } = req.body;

    const [existing] = await pool.execute(
      `SELECT id FROM site_settings WHERE restaurant_id = ? LIMIT 1`,
      [restaurantId]
    );

    if (existing.length === 0) {
      await pool.execute(
        `INSERT INTO site_settings (restaurant_id, hero_title, hero_subtitle, hero_image_url, banner_text, banner_enabled, primary_color, secondary_color, announcement_ticker, store_hours)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          restaurantId,
          hero_title,
          hero_subtitle,
          hero_image_url,
          banner_text,
          banner_enabled ? 1 : 0,
          primary_color,
          secondary_color,
          announcement_ticker,
          store_hours
        ]
      );
    } else {
      await pool.execute(
        `UPDATE site_settings SET
          hero_title = ?,
          hero_subtitle = ?,
          hero_image_url = ?,
          banner_text = ?,
          banner_enabled = ?,
          primary_color = ?,
          secondary_color = ?,
          announcement_ticker = ?,
          store_hours = ?
         WHERE restaurant_id = ?`,
        [
          hero_title,
          hero_subtitle,
          hero_image_url,
          banner_text,
          banner_enabled ? 1 : 0,
          primary_color,
          secondary_color,
          announcement_ticker,
          store_hours,
          restaurantId
        ]
      );
    }

    const [updated] = await pool.execute(
      `SELECT * FROM site_settings WHERE restaurant_id = ? LIMIT 1`,
      [restaurantId]
    );

    // Broadcast live socket update so guest storefront updates without refresh
    try {
      const io = getIO();
      if (io) {
        io.emit('siteSettingsUpdated', updated[0]);
      }
    } catch {
      /* socket non-fatal */
    }

    return res.json({
      success: true,
      message: 'Site settings updated successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error('Error updating site settings:', error);
    return res.status(500).json({ success: false, message: 'Failed to update site settings' });
  }
}

module.exports = {
  getPublicSiteSettings,
  getOwnerSiteSettings,
  updateSiteSettings
};
