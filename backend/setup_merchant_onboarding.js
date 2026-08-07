const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });

    // Create merchant_onboarding table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS merchant_onboarding (
        id INT AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NOT NULL UNIQUE,
        specialist_name VARCHAR(255) DEFAULT 'Sarah Jenkins',
        step_profile_setup TINYINT(1) DEFAULT 0,
        step_menu_import TINYINT(1) DEFAULT 0,
        step_payment_setup TINYINT(1) DEFAULT 0,
        step_seo_connect TINYINT(1) DEFAULT 0,
        status ENUM('In Onboarding', 'Active Ready', 'Completed') DEFAULT 'In Onboarding',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Insert onboarding rows for all existing restaurants if not existing
    const [restaurants] = await pool.execute('SELECT id FROM restaurants');
    for (const r of restaurants) {
      await pool.execute(
        `INSERT IGNORE INTO merchant_onboarding (restaurant_id, specialist_name, step_profile_setup, step_menu_import, step_payment_setup, step_seo_connect, status)
         VALUES (?, 'Sarah Jenkins', 1, 0, 1, 0, 'In Onboarding')`,
        [r.id]
      );
    }

    console.log('✅ Created merchant_onboarding table and initialized rows!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error setting up merchant_onboarding table:', err);
    process.exit(1);
  }
})();
