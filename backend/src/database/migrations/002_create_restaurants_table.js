module.exports = {
  name: '002_create_restaurants_table',
  up: async (pool) => {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255) NOT NULL,
        address VARCHAR(255) NOT NULL,
        cuisine VARCHAR(100) NOT NULL,
        opening_time TIME NOT NULL,
        closing_time TIME NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
};
