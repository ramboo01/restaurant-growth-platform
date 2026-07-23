module.exports = {
  name: '008_create_inventory_table',
  up: async (pool) => {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS inventory (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NOT NULL,
        item_name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        quantity DECIMAL(10, 2) NOT NULL,
        minimum_quantity DECIMAL(10, 2) NOT NULL,
        supplier VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_inventory_restaurant_id (restaurant_id)
      )
    `);
  }
};
