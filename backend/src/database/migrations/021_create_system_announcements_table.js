const { getDatabasePool } = require('../../config/database');

async function up() {
  const pool = getDatabasePool();
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS system_announcements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type ENUM('info', 'warning', 'danger', 'success') DEFAULT 'info',
      is_active BOOLEAN DEFAULT TRUE,
      target_role ENUM('All', 'Owner', 'Guest', 'Staff') DEFAULT 'All',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert default system announcement
  const [rows] = await pool.execute('SELECT COUNT(*) as cnt FROM system_announcements');
  if (rows[0].cnt === 0) {
    await pool.execute(`
      INSERT INTO system_announcements (title, message, type, is_active, target_role)
      VALUES ('Platform System Nominal', 'Welcome to RestruRent Growth Platform! All channels and order streams are fully operational.', 'info', TRUE, 'All')
    `);
  }

  console.log('[Migration] Migration 021: Created system_announcements table successfully.');
}

async function down() {
  const pool = getDatabasePool();
  await pool.execute('DROP TABLE IF EXISTS system_announcements');
  console.log('[Migration] Migration 021: Dropped system_announcements table.');
}

module.exports = { up, down };
