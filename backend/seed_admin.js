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

    const adminEmail = 'admin@platform.com';
    const adminPassword = 'Admin@123';

    // Check if admin exists
    const [rows] = await pool.execute('SELECT id, email, role FROM users WHERE email = ?', [adminEmail]);

    if (rows.length > 0) {
      // Update role to Admin and update password hash
      const hash = await bcrypt.hash(adminPassword, 10);
      await pool.execute(
        'UPDATE users SET role = "Admin", password = ?, is_blocked = 0 WHERE email = ?',
        [hash, adminEmail]
      );
      console.log(`✅ Updated existing user ${adminEmail} to Role: Admin with password: ${adminPassword}`);
    } else {
      // Insert new admin user
      const hash = await bcrypt.hash(adminPassword, 10);
      await pool.execute(
        'INSERT INTO users (name, email, password, role, is_blocked) VALUES (?, ?, ?, ?, 0)',
        ['Platform Super Admin', adminEmail, hash, 'Admin']
      );
      console.log(`🎉 Created new Super Admin user: ${adminEmail} / ${adminPassword}`);
    }

    // Also check if any other user has Admin role
    const [allAdmins] = await pool.execute('SELECT id, name, email, role FROM users WHERE role = "Admin"');
    console.log('📋 Current Platform Admins in DB:', allAdmins);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding admin:', err);
    process.exit(1);
  }
})();
