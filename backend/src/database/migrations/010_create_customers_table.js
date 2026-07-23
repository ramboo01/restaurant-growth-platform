module.exports = {
  name: '010_create_customers_table',
  up: async (pool) => {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255) NOT NULL,
        total_orders INT NOT NULL DEFAULT 0,
        total_spent DECIMAL(10, 2) NOT NULL DEFAULT 0,
        last_order_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_customers_restaurant_id (restaurant_id)
      )
    `);
  }
};
