const { getDatabasePool } = require('../config/database');

async function migrate() {
  const pool = getDatabasePool();
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS customer_notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      restaurant_id INT NOT NULL,
      type VARCHAR(50) NOT NULL DEFAULT 'general',
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id),
      INDEX idx_restaurant_id (restaurant_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('[Migration] customer_notifications table created/verified.');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('[Migration] Failed:', err);
  process.exit(1);
});
