const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const PORT = process.env.PORT || 5000;
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 3306;
const DB_NAME = process.env.DB_NAME || '';
const DB_USER = process.env.DB_USER || '';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const JWT_SECRET = process.env.JWT_SECRET || '';
const FRONTEND_URL = process.env.FRONTEND_URL || '';

console.log('[env] loaded configuration:', {
  PORT,
  DB_HOST,
  DB_PORT,
  DB_NAME: DB_NAME ? '[set]' : '[missing]',
  DB_USER: DB_USER ? '[set]' : '[missing]',
  DB_PASSWORD: DB_PASSWORD ? '[set]' : '[missing]',
  JWT_SECRET: JWT_SECRET ? '[set]' : '[missing]',
  FRONTEND_URL: FRONTEND_URL ? '[set]' : '[missing]'
});

module.exports = {
  PORT,
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  JWT_SECRET,
  FRONTEND_URL
};
