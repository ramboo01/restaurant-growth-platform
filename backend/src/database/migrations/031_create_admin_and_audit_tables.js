const { getDatabasePool } = require('../../config/database');

async function up() {
  const pool = getDatabasePool();

  // 1. Create platform_audit_logs table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS platform_audit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT DEFAULT NULL,
      user_role VARCHAR(50) NOT NULL DEFAULT 'Admin',
      action_type VARCHAR(100) NOT NULL,
      description TEXT NOT NULL,
      ip_address VARCHAR(45) DEFAULT '127.0.0.1',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_action_type (action_type),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 2. Create store_payouts table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS store_payouts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      restaurant_id INT NOT NULL,
      store_name VARCHAR(120) NOT NULL,
      payout_period VARCHAR(60) NOT NULL,
      gross_sales DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      platform_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      tax_withheld DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      net_payout DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      status VARCHAR(30) NOT NULL DEFAULT 'Pending',
      processed_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_restaurant_id (restaurant_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 3. Create profile_merge_queue table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS profile_merge_queue (
      id INT AUTO_INCREMENT PRIMARY KEY,
      primary_guest_id INT NOT NULL,
      duplicate_guest_id INT NOT NULL,
      primary_name VARCHAR(100) NOT NULL,
      duplicate_name VARCHAR(100) NOT NULL,
      match_reason VARCHAR(100) NOT NULL DEFAULT 'Matching Phone Number',
      status VARCHAR(30) NOT NULL DEFAULT 'Pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Seed default payouts if empty
  const [existingPayouts] = await pool.execute('SELECT id FROM store_payouts LIMIT 1');
  if (existingPayouts.length === 0) {
    await pool.execute(`
      INSERT INTO store_payouts (restaurant_id, store_name, payout_period, gross_sales, platform_fee, tax_withheld, net_payout, status)
      VALUES 
      (1, 'Downtown Flagship', 'July 21 - July 27, 2026', 14580.50, 729.03, 1166.44, 12685.03, 'Pending'),
      (1, 'Uptown Bistro', 'July 21 - July 27, 2026', 9420.00, 471.00, 753.60, 8195.40, 'Released')
    `);
  }

  // Seed default merge queue if empty
  const [existingMerges] = await pool.execute('SELECT id FROM profile_merge_queue LIMIT 1');
  if (existingMerges.length === 0) {
    await pool.execute(`
      INSERT INTO profile_merge_queue (primary_guest_id, duplicate_guest_id, primary_name, duplicate_name, match_reason, status)
      VALUES 
      (101, 108, 'John Doe (Guest #101)', 'J. Doe (Guest #108)', 'Matching Phone: +1-555-0199', 'Pending'),
      (102, 115, 'Sarah Smith (Guest #102)', 'Sara Smith (Guest #115)', 'Matching Email: sarah@example.com', 'Pending')
    `);
  }

  // Seed default audit logs if empty
  const [existingLogs] = await pool.execute('SELECT id FROM platform_audit_logs LIMIT 1');
  if (existingLogs.length === 0) {
    await pool.execute(`
      INSERT INTO platform_audit_logs (user_id, user_role, action_type, description)
      VALUES 
      (1, 'Admin', 'SYSTEM_INITIALIZATION', 'Sprint 4 Platform Administration & Financial Compliance modules initialized.'),
      (1, 'Admin', 'PAYOUT_CALCULATION', 'Weekly settlement payouts calculated for Downtown Flagship and Uptown Bistro.'),
      (1, 'Owner', 'PRICE_OVERRIDE_SUBMITTED', 'Submitted regional price override for Truffle Mushroom Burger.')
    `);
  }
}

async function down() {
  const pool = getDatabasePool();
  await pool.execute('DROP TABLE IF EXISTS profile_merge_queue;');
  await pool.execute('DROP TABLE IF EXISTS store_payouts;');
  await pool.execute('DROP TABLE IF EXISTS platform_audit_logs;');
}

module.exports = { up, down };
