module.exports = {
  name: '026_create_user_restaurants_junction_table',
  up: async (pool) => {
    // Junction table: allows one user to access multiple restaurants
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS user_restaurants (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        restaurant_id INT NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'Owner',
        is_primary BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_restaurant (user_id, restaurant_id),
        INDEX idx_user_id (user_id),
        INDEX idx_restaurant_id (restaurant_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Seed: Link existing users to their restaurant_id from users table
    const [users] = await pool.execute(
      `SELECT id, restaurant_id FROM users WHERE restaurant_id IS NOT NULL`
    );
    for (const user of users) {
      const [existing] = await pool.execute(
        `SELECT id FROM user_restaurants WHERE user_id = ? AND restaurant_id = ?`,
        [user.id, user.restaurant_id]
      );
      if (existing.length === 0) {
        await pool.execute(
          `INSERT INTO user_restaurants (user_id, restaurant_id, role, is_primary) VALUES (?, ?, 'Owner', TRUE)`,
          [user.id, user.restaurant_id]
        );
      }
    }

    // Also link all existing restaurants to user ID 1 (sfdv owner) if not already linked
    const [allRestaurants] = await pool.execute(`SELECT id FROM restaurants`);
    for (const rest of allRestaurants) {
      const [existing] = await pool.execute(
        `SELECT id FROM user_restaurants WHERE user_id = 1 AND restaurant_id = ?`,
        [rest.id]
      );
      if (existing.length === 0) {
        const isPrimary = rest.id === 1;
        await pool.execute(
          `INSERT INTO user_restaurants (user_id, restaurant_id, role, is_primary) VALUES (1, ?, 'Owner', ?)`,
          [rest.id, isPrimary]
        );
      }
    }
  }
};
