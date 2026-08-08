const mysql = require('mysql2/promise');
const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = require('./env');

let pool;

function getDatabasePool() {
  if (!pool) {
    pool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT,
      database: DB_NAME,
      user: DB_USER,
      password: DB_PASSWORD,
      ssl: DB_HOST && !DB_HOST.includes('localhost') && DB_HOST !== '127.0.0.1' ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }

  return pool;
}

async function checkDatabaseConnection() {
  try {
    const connection = await getDatabasePool().getConnection();
    try {
      await connection.ping();
      return true;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('[database] connection failed:', error);
    console.error('[database] stack trace:', error.stack);
    throw error;
  }
}

module.exports = {
  getDatabasePool,
  checkDatabaseConnection
};
