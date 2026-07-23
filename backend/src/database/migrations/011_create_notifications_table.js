module.exports = {
  name: '011_create_notifications_table',
  up: async (pool) => {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_notifications_restaurant_id (restaurant_id)
      )
    `);
  }
};
