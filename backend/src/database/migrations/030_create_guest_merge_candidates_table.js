const { getDatabasePool } = require('../../config/database');

async function up() {
  const pool = getDatabasePool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS guest_merge_candidates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      restaurant_id INT NOT NULL,
      candidate_customer_id INT NOT NULL,
      existing_customer_id INT NOT NULL,
      confidence_score DECIMAL(5,2) NOT NULL,
      match_reasons TEXT DEFAULT NULL,
      card_hash_match TINYINT(1) DEFAULT 0,
      device_fingerprint_match TINYINT(1) DEFAULT 0,
      name_similarity DECIMAL(5,2) DEFAULT 0.00,
      status ENUM('PENDING_ADMIN_REVIEW', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING_ADMIN_REVIEW',
      reviewed_by_user_id INT DEFAULT NULL,
      review_note TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_rest_status (restaurant_id, status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('[Migration] Created guest_merge_candidates table successfully.');
}

async function down() {
  const pool = getDatabasePool();
  await pool.query(`DROP TABLE IF EXISTS guest_merge_candidates;`);
}

module.exports = { up, down };
