const { getDatabasePool } = require('../../config/database');

async function up() {
  const pool = getDatabasePool();
  try {
    await pool.query(`ALTER TABLE customers ADD COLUMN card_hash VARCHAR(255) DEFAULT NULL;`);
  } catch (e) {
    // Ignore if column already exists
  }
  try {
    await pool.query(`ALTER TABLE customers ADD COLUMN device_fingerprint VARCHAR(255) DEFAULT NULL;`);
  } catch (e) {
    // Ignore if column already exists
  }
  console.log('[Migration] Patched customers table with card_hash and device_fingerprint columns.');
}

async function down() {
  // No-op
}

module.exports = { up, down };
