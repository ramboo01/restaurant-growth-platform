const { getDatabasePool } = require('../../config/database');

async function up() {
  const pool = getDatabasePool();

  // 1. Create staff_shifts table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS staff_shifts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      restaurant_id INT NOT NULL,
      staff_id INT DEFAULT NULL,
      staff_name VARCHAR(100) DEFAULT 'Open Shift',
      role VARCHAR(50) NOT NULL DEFAULT 'Kitchen',
      shift_date DATE NOT NULL,
      start_time VARCHAR(20) NOT NULL,
      end_time VARCHAR(20) NOT NULL,
      is_open_shift BOOLEAN NOT NULL DEFAULT FALSE,
      status VARCHAR(30) NOT NULL DEFAULT 'Scheduled',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_restaurant_id (restaurant_id),
      INDEX idx_shift_date (shift_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 2. Create franchise_compliance table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS franchise_compliance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      restaurant_id INT NOT NULL UNIQUE,
      store_name VARCHAR(120) NOT NULL,
      location_city VARCHAR(100) NOT NULL DEFAULT 'Downtown',
      food_safety_score INT NOT NULL DEFAULT 98,
      brand_standard_score INT NOT NULL DEFAULT 95,
      speed_score INT NOT NULL DEFAULT 92,
      review_score DECIMAL(3,2) NOT NULL DEFAULT 4.80,
      audit_status VARCHAR(40) NOT NULL DEFAULT 'Compliant',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 3. Create price_override_requests table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS price_override_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      restaurant_id INT NOT NULL,
      store_name VARCHAR(120) NOT NULL,
      menu_item_name VARCHAR(120) NOT NULL,
      current_price DECIMAL(8,2) NOT NULL,
      requested_price DECIMAL(8,2) NOT NULL,
      reason VARCHAR(255) DEFAULT 'Local ingredient cost surge',
      status VARCHAR(30) NOT NULL DEFAULT 'Pending',
      requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Seed default shifts for restaurant 1 if empty
  const [existingShifts] = await pool.execute('SELECT id FROM staff_shifts WHERE restaurant_id = 1 LIMIT 1');
  if (existingShifts.length === 0) {
    const today = new Date().toISOString().split('T')[0];
    await pool.execute(`
      INSERT INTO staff_shifts (restaurant_id, staff_id, staff_name, role, shift_date, start_time, end_time, is_open_shift, status)
      VALUES 
      (1, 1, 'Marco Rossi', 'Executive Chef', ?, '08:00 AM', '04:00 PM', FALSE, 'Scheduled'),
      (1, 2, 'Elena Rostova', 'Sous Chef', ?, '12:00 PM', '08:00 PM', FALSE, 'Scheduled'),
      (1, NULL, 'Open Shift', 'Line Cook', ?, '04:00 PM', '11:00 PM', TRUE, 'Open'),
      (1, NULL, 'Open Shift', 'Front-of-House Cashier', ?, '10:00 AM', '05:00 PM', TRUE, 'Open')
    `, [today, today, today, today]);
  }

  // Seed default franchise compliance for restaurant 1 if empty
  const [existingFranchise] = await pool.execute('SELECT id FROM franchise_compliance WHERE restaurant_id = 1 LIMIT 1');
  if (existingFranchise.length === 0) {
    await pool.execute(`
      INSERT INTO franchise_compliance (restaurant_id, store_name, location_city, food_safety_score, brand_standard_score, speed_score, review_score, audit_status)
      VALUES 
      (1, 'Downtown Flagship', 'New York', 98, 96, 94, 4.85, 'Compliant')
    `);
  }

  // Seed default price override request if empty
  const [existingOverrides] = await pool.execute('SELECT id FROM price_override_requests WHERE restaurant_id = 1 LIMIT 1');
  if (existingOverrides.length === 0) {
    await pool.execute(`
      INSERT INTO price_override_requests (restaurant_id, store_name, menu_item_name, current_price, requested_price, reason, status)
      VALUES 
      (1, 'Downtown Flagship', 'Truffle Mushroom Burger', 18.99, 21.99, 'Truffle oil supply cost increase', 'Pending'),
      (1, 'Downtown Flagship', 'Artisanal Latte', 4.50, 5.25, 'Organic oat milk local rate shift', 'Pending')
    `);
  }
}

async function down() {
  const pool = getDatabasePool();
  await pool.execute('DROP TABLE IF EXISTS price_override_requests;');
  await pool.execute('DROP TABLE IF EXISTS franchise_compliance;');
  await pool.execute('DROP TABLE IF EXISTS staff_shifts;');
}

module.exports = { up, down };
