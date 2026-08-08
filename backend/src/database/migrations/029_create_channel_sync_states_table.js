const { getDatabasePool } = require('../../config/database');

async function up() {
  const pool = getDatabasePool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS channel_sync_states (
      id INT AUTO_INCREMENT PRIMARY KEY,
      restaurant_id INT NOT NULL,
      channel_name VARCHAR(100) NOT NULL,
      consecutive_failures INT NOT NULL DEFAULT 0,
      circuit_state ENUM('CLOSED', 'OPEN', 'HALF_OPEN') NOT NULL DEFAULT 'CLOSED',
      last_failure_at TIMESTAMP NULL DEFAULT NULL,
      last_success_at TIMESTAMP NULL DEFAULT NULL,
      whatsapp_alert_sent TINYINT(1) NOT NULL DEFAULT 0,
      last_error_message TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_rest_channel (restaurant_id, channel_name),
      INDEX idx_restaurant_state (restaurant_id, circuit_state)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('[Migration] Created channel_sync_states table successfully.');
}

async function down() {
  const pool = getDatabasePool();
  await pool.query(`DROP TABLE IF EXISTS channel_sync_states;`);
}

module.exports = { up, down };
