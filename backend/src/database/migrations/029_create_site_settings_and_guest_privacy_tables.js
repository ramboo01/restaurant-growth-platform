module.exports = {
  name: '029_create_site_settings_and_guest_privacy_tables',
  up: async (pool) => {
    // 1. Site settings table for Storefront Customization (OWN-007)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NOT NULL DEFAULT 1,
        hero_title VARCHAR(255) DEFAULT 'Delicious Food Delivered Straight To Your Door',
        hero_subtitle VARCHAR(550) DEFAULT 'Freshly prepared, responsibly sourced, and lightning fast.',
        hero_image_url VARCHAR(550) DEFAULT '',
        banner_text VARCHAR(550) DEFAULT '🎉 Special Offer: Order direct & save 15% on your first meal! Code: DIRECT15',
        banner_enabled BOOLEAN DEFAULT TRUE,
        primary_color VARCHAR(50) DEFAULT '#e91e8c',
        secondary_color VARCHAR(50) DEFAULT '#667eea',
        announcement_ticker VARCHAR(550) DEFAULT '🚚 Free delivery on orders over $30 | ⏱️ Avg Delivery Time: 25 Mins',
        store_hours VARCHAR(255) DEFAULT 'Mon - Sun: 10:00 AM - 11:00 PM',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure default row exists for restaurant 1
    const [rows] = await pool.execute(`SELECT id FROM site_settings WHERE restaurant_id = 1 LIMIT 1`);
    if (rows.length === 0) {
      await pool.execute(`INSERT INTO site_settings (restaurant_id) VALUES (1)`);
    }

    // 2. Guest preferences table for Guest Privacy (GST-009)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS guest_preferences (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        email_opt_in BOOLEAN DEFAULT TRUE,
        sms_opt_in BOOLEAN DEFAULT TRUE,
        whatsapp_opt_in BOOLEAN DEFAULT TRUE,
        push_opt_in BOOLEAN DEFAULT TRUE,
        direct_incentive_opt_in BOOLEAN DEFAULT TRUE,
        erasure_requested BOOLEAN DEFAULT FALSE,
        erasure_requested_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('[migrate] Created site_settings and guest_preferences tables successfully.');
  }
};
