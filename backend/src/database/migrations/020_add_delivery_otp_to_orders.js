const { getDatabasePool } = require('../../config/database');

async function up() {
  const pool = getDatabasePool();
  try {
    await pool.execute(`
      ALTER TABLE orders 
      ADD COLUMN delivery_otp VARCHAR(4) DEFAULT '1234'
    `);
    console.log('[Migration] Migration 020: Added delivery_otp column to orders table.');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('[Migration] Migration 020: delivery_otp column already exists.');
    } else {
      throw err;
    }
  }
}

async function down() {
  const pool = getDatabasePool();
  try {
    await pool.execute('ALTER TABLE orders DROP COLUMN delivery_otp');
    console.log('[Migration] Migration 020: Dropped delivery_otp column.');
  } catch (err) {
    console.log('[Migration] Error dropping delivery_otp:', err.message);
  }
}

module.exports = { up, down };
