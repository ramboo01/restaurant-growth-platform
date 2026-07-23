module.exports = {
  name: '007_create_drivers_table',
  up: async (pool) => {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS drivers (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        vehicle_number VARCHAR(100) NOT NULL,
        license_number VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_drivers_restaurant_id (restaurant_id)
      )
    `);
  }
};
