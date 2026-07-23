module.exports = {
  name: '009_create_loyalty_members_table',
  up: async (pool) => {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS loyalty_members (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        points INT NOT NULL,
        tier VARCHAR(50) NOT NULL,
        joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_loyalty_restaurant_id (restaurant_id)
      )
    `);
  }
};
