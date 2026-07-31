const { getDatabasePool } = require('../../config/database');

async function up() {
  const pool = getDatabasePool();

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS delivery_configs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      restaurant_id INT NOT NULL UNIQUE,
      radius_limit DECIMAL(4,1) NOT NULL DEFAULT 5.5,
      base_delivery_fee DECIMAL(6,2) NOT NULL DEFAULT 3.99,
      min_order_value DECIMAL(6,2) NOT NULL DEFAULT 15.00,
      free_delivery_threshold DECIMAL(6,2) NOT NULL DEFAULT 50.00,
      is_surge_active BOOLEAN NOT NULL DEFAULT FALSE,
      surge_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.50,
      priority_json TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Seed default delivery config for restaurant 1 if not exists
  const [existing] = await pool.execute('SELECT id FROM delivery_configs WHERE restaurant_id = 1');
  if (existing.length === 0) {
    await pool.execute(`
      INSERT INTO delivery_configs (restaurant_id, radius_limit, base_delivery_fee, min_order_value, free_delivery_threshold, is_surge_active, surge_multiplier, priority_json)
      VALUES (1, 5.5, 3.99, 15.00, 50.00, FALSE, 1.50, ?)
    `, [JSON.stringify(['Owned Couriers', 'DoorDash Drive', 'Uber Direct'])]);
  }
}

async function down() {
  const pool = getDatabasePool();
  await pool.execute('DROP TABLE IF EXISTS delivery_configs;');
}

module.exports = { up, down };
