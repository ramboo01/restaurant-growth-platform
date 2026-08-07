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

    // Delete fake store payouts
    await pool.execute('TRUNCATE TABLE store_payouts').catch(() => {
      return pool.execute('DELETE FROM store_payouts');
    });

    console.log('✅ Cleared fake store payouts from DB.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error clearing store payouts:', err);
    process.exit(1);
  }
})();
