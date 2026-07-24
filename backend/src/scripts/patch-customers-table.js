const mysql = require('mysql2/promise');
const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = require('../config/env');

async function main() {
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT),
    database: DB_NAME,
    user: DB_USER,
    password: DB_PASSWORD
  });

  try {
    // Check if 'notes' column exists
    const [notesRows] = await conn.execute(
      `SHOW COLUMNS FROM customers LIKE 'notes'`
    );
    if (notesRows.length === 0) {
      console.log('Adding column "notes" to customers table...');
      await conn.execute('ALTER TABLE customers ADD COLUMN notes TEXT NULL');
    } else {
      console.log('Column "notes" already exists.');
    }

    // Check if 'segment' column exists
    const [segmentRows] = await conn.execute(
      `SHOW COLUMNS FROM customers LIKE 'segment'`
    );
    if (segmentRows.length === 0) {
      console.log('Adding column "segment" to customers table...');
      await conn.execute("ALTER TABLE customers ADD COLUMN segment VARCHAR(50) DEFAULT 'New'");
    } else {
      console.log('Column "segment" already exists.');
    }

    console.log('Customers table successfully patched.');
  } catch (error) {
    console.error('Error patching customers table:', error.message);
  } finally {
    await conn.end();
  }
}

main().catch(console.error);
