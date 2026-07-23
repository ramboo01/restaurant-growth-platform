module.exports = {
  name: '013_add_restaurant_id_to_users_table',
  up: async (pool) => {
    await pool.execute(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS restaurant_id INT NULL AFTER role
    `);
  }
};
