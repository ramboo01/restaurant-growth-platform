module.exports = {
  name: '003_create_menu_categories_table',
  up: async (pool) => {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS menu_categories (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        display_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_menu_categories_restaurant_id (restaurant_id)
      )
    `);
  }
};
