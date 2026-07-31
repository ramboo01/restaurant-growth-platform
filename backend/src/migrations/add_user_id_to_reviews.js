const { getDatabasePool } = require('../config/database');

async function migrate() {
  const pool = getDatabasePool();
  // Add user_id column to customer_reviews to link reviews to registered users
  await pool.execute(`
    ALTER TABLE customer_reviews
    ADD COLUMN IF NOT EXISTS user_id INT NULL DEFAULT NULL AFTER id
  `);
  console.log('[Migration] user_id column added to customer_reviews.');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('[Migration] Failed:', err.message);
  process.exit(1);
});
