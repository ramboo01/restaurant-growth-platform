const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../src/app');
const { getDatabasePool } = require('../src/config/database');

const pool = getDatabasePool();
const TEST_EMAIL_DOMAIN = '@integration.test';

function uniqueSuffix() {
  return `${Date.now()}_${Math.round(Math.random() * 1000000)}`;
}

async function registerAndLogin({
  role = 'Owner',
  restaurantId = null,
  name = 'Integration User'
} = {}) {
  const suffix = uniqueSuffix();
  const email = `user_${suffix}${TEST_EMAIL_DOMAIN}`;
  const password = 'Password123!';
  const assignedRestaurantId = restaurantId || await createRestaurantRecord();

  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send({
      name,
      email,
      password,
      role,
      restaurantId: assignedRestaurantId
    });

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  return {
    email,
    password,
    registerResponse,
    loginResponse,
    token: loginResponse.body?.data?.token,
    user: loginResponse.body?.data?.user,
    restaurantId: assignedRestaurantId
  };
}

async function createRestaurantRecord(overrides = {}) {
  const suffix = uniqueSuffix();
  const [result] = await pool.execute(
    `INSERT INTO restaurants (name, phone, email, address, cuisine, opening_time, closing_time)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      overrides.name || `Integration Seed Restaurant ${suffix}`,
      overrides.phone || '9999999999',
      overrides.email || `seed_restaurant_${suffix}${TEST_EMAIL_DOMAIN}`,
      overrides.address || '123 Integration Seed Street',
      overrides.cuisine || 'Indian',
      overrides.openingTime || '09:00:00',
      overrides.closingTime || '22:00:00'
    ]
  );

  return result.insertId;
}

async function createRestaurant(token, overrides = {}) {
  const suffix = uniqueSuffix();

  return request(app)
    .post('/api/restaurants')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: overrides.name || `Integration Restaurant ${suffix}`,
      phone: overrides.phone || '9999999999',
      email: overrides.email || `restaurant_${suffix}${TEST_EMAIL_DOMAIN}`,
      address: overrides.address || '123 Integration Street',
      cuisine: overrides.cuisine || 'Indian',
      openingTime: overrides.openingTime || '09:00:00',
      closingTime: overrides.closingTime || '22:00:00'
    });
}

async function assignUserToRestaurant(userId, restaurantId) {
  await pool.execute(
    'UPDATE users SET restaurant_id = ? WHERE id = ?',
    [restaurantId, userId]
  );
}

async function cleanupTestData() {
  const safeDelete = async (query, params) => {
    try { await pool.execute(query, params); } catch (err) { /* ignore table missing errors in test cleanup */ }
  };
  await safeDelete('DELETE FROM notifications WHERE title LIKE ?', ['%Integration%']);
  await safeDelete('DELETE FROM customers WHERE email LIKE ?', [`%${TEST_EMAIL_DOMAIN}`]);
  await safeDelete('DELETE FROM loyalty_members WHERE customer_name LIKE ?', ['%Integration%']);
  await safeDelete('DELETE FROM inventory WHERE supplier LIKE ?', ['%Integration%']);
  await safeDelete('DELETE FROM drivers WHERE name LIKE ?', ['%Integration%']);
  await safeDelete('DELETE FROM staff WHERE email LIKE ?', [`%${TEST_EMAIL_DOMAIN}`]);
  await safeDelete('DELETE FROM orders WHERE order_number LIKE ?', ['INT-%']);
  await safeDelete('DELETE FROM menu_items WHERE name LIKE ?', ['%Integration%']);
  await safeDelete('DELETE FROM menu_categories WHERE name LIKE ?', ['%Integration%']);
  await safeDelete('DELETE FROM restaurants WHERE email LIKE ?', [`%${TEST_EMAIL_DOMAIN}`]);
  await safeDelete('DELETE FROM users WHERE email LIKE ?', [`%${TEST_EMAIL_DOMAIN}`]);
}

function getFixturePath(filename) {
  return path.join(__dirname, 'fixtures', filename);
}

async function removeUploadedFileIfExists(uploadPath) {
  if (!uploadPath) {
    return;
  }

  const normalizedPath = uploadPath.replace(/\//g, path.sep);
  const absolutePath = path.join(__dirname, '..', normalizedPath);
  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }
}

module.exports = {
  app,
  pool,
  request,
  registerAndLogin,
  createRestaurant,
  createRestaurantRecord,
  assignUserToRestaurant,
  cleanupTestData,
  getFixturePath,
  removeUploadedFileIfExists
};
