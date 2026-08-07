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

    // 1. Truncate / delete fake data from guest_privacy_requests
    await pool.execute(`TRUNCATE TABLE guest_privacy_requests`).catch(() => {
      return pool.execute(`DELETE FROM guest_privacy_requests`);
    });
    console.log('✅ Cleared fake seed data from guest_privacy_requests table.');

    // 2. Clear fake rows from profile_merge_queue
    await pool.execute(`TRUNCATE TABLE profile_merge_queue`).catch(() => {
      return pool.execute(`DELETE FROM profile_merge_queue`);
    });
    console.log('✅ Cleared fake seed data from profile_merge_queue table.');

    console.log('🎉 Database cleaned! Privacy Console is now 100% live and ready for real data.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error cleaning tables:', err);
    process.exit(1);
  }
})();
