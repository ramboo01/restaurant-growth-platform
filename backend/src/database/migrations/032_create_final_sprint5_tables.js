const { getDatabasePool } = require('../../config/database');

async function up() {
  const pool = getDatabasePool();

  // 1. Create channel_sync_status table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS channel_sync_status (
      id INT AUTO_INCREMENT PRIMARY KEY,
      channel_name VARCHAR(80) NOT NULL UNIQUE,
      channel_type VARCHAR(50) NOT NULL DEFAULT 'POS / Delivery',
      status VARCHAR(30) NOT NULL DEFAULT 'Active',
      last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 2. Create franchise_applications table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS franchise_applications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      applicant_name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL,
      phone VARCHAR(30) NOT NULL,
      target_city VARCHAR(100) NOT NULL,
      investment_capacity DECIMAL(12,2) NOT NULL DEFAULT 250000.00,
      status VARCHAR(30) NOT NULL DEFAULT 'Under Review',
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 3. Create staff_instant_payouts table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS staff_instant_payouts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      staff_name VARCHAR(100) NOT NULL,
      shift_date DATE NOT NULL,
      tips_earned DECIMAL(8,2) NOT NULL DEFAULT 0.00,
      base_pay DECIMAL(8,2) NOT NULL DEFAULT 0.00,
      total_payout DECIMAL(8,2) NOT NULL DEFAULT 0.00,
      status VARCHAR(30) NOT NULL DEFAULT 'Paid',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Seed channels if empty
  const [existingChannels] = await pool.execute('SELECT id FROM channel_sync_status LIMIT 1');
  if (existingChannels.length === 0) {
    await pool.execute(`
      INSERT INTO channel_sync_status (channel_name, channel_type, status)
      VALUES 
      ('Toast POS Integration', 'POS System', 'Active'),
      ('UberEats Live Dispatch', 'Delivery Aggregator', 'Active'),
      ('DoorDash Direct Integration', 'Delivery Aggregator', 'Active'),
      ('Google Reserve & Local SEO', 'Discovery Engine', 'Active'),
      ('WhatsApp Order Bot API', 'Messaging Channel', 'Active')
    `);
  }

  // Seed franchise applications if empty
  const [existingApps] = await pool.execute('SELECT id FROM franchise_applications LIMIT 1');
  if (existingApps.length === 0) {
    await pool.execute(`
      INSERT INTO franchise_applications (applicant_name, email, phone, target_city, investment_capacity, status)
      VALUES 
      ('David Miller', 'david.miller@franchise.com', '+1-555-0988', 'Chicago, IL', 350000.00, 'Under Review'),
      ('Sophia Chen', 'sophia.chen@retail.org', '+1-555-0744', 'Miami, FL', 500000.00, 'Approved')
    `);
  }
}

async function down() {
  const pool = getDatabasePool();
  await pool.execute('DROP TABLE IF EXISTS staff_instant_payouts;');
  await pool.execute('DROP TABLE IF EXISTS franchise_applications;');
  await pool.execute('DROP TABLE IF EXISTS channel_sync_status;');
}

module.exports = { up, down };
