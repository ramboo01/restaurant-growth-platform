const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
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

    const passHash123 = await bcrypt.hash('admin123', 10);
    const passHashPlatform = await bcrypt.hash('Admin@123', 10);

    // 1. Unblock & set ownerr@gmail.com to Admin
    await pool.execute(
      `UPDATE users SET role = 'Admin', is_blocked = 0, blocked_at = NULL, blocked_reason = NULL, password = ? WHERE email = 'ownerr@gmail.com'`,
      [passHash123]
    );

    // 2. Set adminn@gmail.com to Admin & unblock
    await pool.execute(
      `UPDATE users SET role = 'Admin', is_blocked = 0, blocked_at = NULL, blocked_reason = NULL, password = ? WHERE email = 'adminn@gmail.com'`,
      [passHash123]
    );

    // 3. Ensure admin@platform.com is Admin & unblock
    await pool.execute(
      `UPDATE users SET role = 'Admin', is_blocked = 0, blocked_at = NULL, blocked_reason = NULL, password = ? WHERE email = 'admin@platform.com'`,
      [passHashPlatform]
    );

    console.log('✅ Unblocked and granted Admin role to: ownerr@gmail.com, adminn@gmail.com, admin@platform.com');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating DB users:', err);
    process.exit(1);
  }
})();
