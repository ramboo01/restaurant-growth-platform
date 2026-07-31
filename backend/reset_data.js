const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

async function clearStaffAndDrivers() {
  console.log('🧹 CLEARING TEST STAFF AND DRIVERS...');
  
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'restrurent_db',
    waitForConnections: true,
    connectionLimit: 5
  });

  try {
    await pool.execute('DELETE FROM drivers');
    await pool.execute('ALTER TABLE drivers AUTO_INCREMENT = 1');
    console.log('✅ Cleared drivers table!');

    await pool.execute('DELETE FROM staff');
    await pool.execute('ALTER TABLE staff AUTO_INCREMENT = 1');
    console.log('✅ Cleared staff table!');

    // Create 1 active default staff & driver for Restaurant 1 if needed, or leave at 0 so user can add them!
    console.log('✅ Staff and Drivers are now completely empty (0)!');

  } catch (err) {
    console.error('❌ Reset Error:', err.message);
  } finally {
    await pool.end();
  }
}

clearStaffAndDrivers();
