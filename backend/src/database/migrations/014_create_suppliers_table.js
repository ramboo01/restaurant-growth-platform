module.exports = {
  name: '014_create_suppliers_table',
  up: async (pool) => {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        contact_person VARCHAR(100) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255) NOT NULL,
        delivery_days VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_suppliers_restaurant_id (restaurant_id)
      )
    `);
  }
};
