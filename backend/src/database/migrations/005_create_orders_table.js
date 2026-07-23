module.exports = {
  name: '005_create_orders_table',
  up: async (pool) => {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50) NOT NULL,
        order_number VARCHAR(100) NOT NULL UNIQUE,
        total_amount DECIMAL(10, 2) NOT NULL,
        order_status VARCHAR(50) NOT NULL,
        payment_status VARCHAR(50) NOT NULL DEFAULT 'Pending',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_orders_restaurant_id (restaurant_id)
      )
    `);
  }
};
