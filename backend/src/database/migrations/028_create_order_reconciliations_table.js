const { getDatabasePool } = require('../../config/database');

async function up() {
  const pool = getDatabasePool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_reconciliations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      restaurant_id INT NOT NULL,
      order_number VARCHAR(100) DEFAULT NULL,
      customer_name VARCHAR(255) DEFAULT NULL,
      customer_phone VARCHAR(100) DEFAULT NULL,
      total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      payment_intent_id VARCHAR(255) DEFAULT NULL,
      error_reason TEXT DEFAULT NULL,
      status ENUM('PENDING_REFUND', 'REFUNDED', 'FAILED') NOT NULL DEFAULT 'PENDING_REFUND',
      refund_transaction_id VARCHAR(255) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_restaurant (restaurant_id),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('[Migration] Created order_reconciliations table successfully.');
}

async function down() {
  const pool = getDatabasePool();
  await pool.query(`DROP TABLE IF EXISTS order_reconciliations;`);
}

module.exports = { up, down };
