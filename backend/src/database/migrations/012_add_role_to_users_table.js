module.exports = {
  name: '012_add_role_to_users_table',
  up: async (pool) => {
    await pool.execute(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS role VARCHAR(50) NOT NULL DEFAULT 'Owner' AFTER password
    `);
  }
};
