const { getDatabasePool } = require('../../config/database');

async function up() {
  const pool = getDatabasePool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS guest_merge_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      restaurant_id INT NOT NULL,
      primary_customer_id INT NOT NULL,
      secondary_customer_id INT NOT NULL,
      secondary_customer_snapshot LONGTEXT NOT NULL,
      confidence_score DECIMAL(5,2) NOT NULL,
      merged_by ENUM('SYSTEM_AUTO_85', 'ADMIN_MANUAL') NOT NULL DEFAULT 'SYSTEM_AUTO_85',
      reason_code VARCHAR(100) DEFAULT NULL,
      status ENUM('ACTIVE', 'REVERTED') NOT NULL DEFAULT 'ACTIVE',
      reverted_at TIMESTAMP NULL DEFAULT NULL,
      revert_reason TEXT DEFAULT NULL,
      merged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_rest_primary (restaurant_id, primary_customer_id),
      INDEX idx_status_date (status, merged_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('[Migration] Created guest_merge_history table successfully.');
}

async function down() {
  const pool = getDatabasePool();
  await pool.query(`DROP TABLE IF EXISTS guest_merge_history;`);
}

module.exports = { up, down };
