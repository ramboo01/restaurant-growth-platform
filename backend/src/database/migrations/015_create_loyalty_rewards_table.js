module.exports = {
  name: '015_create_loyalty_rewards_table',
  up: async (pool) => {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS loyalty_rewards (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        points_required INT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Active',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_rewards_restaurant_id (restaurant_id)
      )
    `);
  }
};
