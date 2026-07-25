const { getDatabasePool } = require('../../config/database');

async function up() {
  const pool = getDatabasePool();
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS staff_attendance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      staff_id INT NOT NULL,
      restaurant_id INT NOT NULL,
      clock_in TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      clock_out TIMESTAMP NULL DEFAULT NULL,
      total_hours DECIMAL(5,2) DEFAULT 0.00,
      status ENUM('Active', 'Completed') DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX(staff_id),
      INDEX(restaurant_id),
      INDEX(status)
    )
  `);

  console.log('[Migration] Migration 019: Created staff_attendance table successfully.');
}

async function down() {
  const pool = getDatabasePool();
  await pool.execute('DROP TABLE IF EXISTS staff_attendance');
  console.log('[Migration] Migration 019: Dropped staff_attendance table.');
}

module.exports = { up, down };
