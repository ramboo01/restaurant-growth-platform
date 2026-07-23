module.exports = {
  name: '004_create_menu_items_table',
  up: async (pool) => {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        image_url VARCHAR(500) DEFAULT NULL,
        is_available TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_menu_items_restaurant_id (restaurant_id)
      )
    `);
  }
};
