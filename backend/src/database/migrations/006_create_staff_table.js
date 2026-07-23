module.exports = {
  name: '006_create_staff_table',
  up: async (pool) => {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS staff (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(100) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255) NOT NULL,
        shift VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_staff_restaurant_id (restaurant_id)
      )
    `);
  }
};
