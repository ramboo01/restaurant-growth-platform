const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../config/env');
const { getDatabasePool } = require('../../config/database');

const USER_ROLES = ['Admin', 'Owner', 'Manager', 'Staff', 'Driver'];

function getJwtSecret() {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is missing from environment variables.');
  }
  return JWT_SECRET;
}

function normalizeRole(role) {
  return role || 'Owner';
}

async function registerUser({ name, email, password, role, restaurantId }) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedRole = normalizeRole(role);

  try {
    if (restaurantId) {
      const [restaurants] = await getDatabasePool().execute(
        'SELECT id FROM restaurants WHERE id = ? LIMIT 1',
        [restaurantId]
      );
      if (restaurants.length === 0) {
        const notFoundError = new Error('Restaurant not found with the provided ID.');
        notFoundError.code = 'RESTAURANT_NOT_FOUND';
        notFoundError.statusCode = 400;
        throw notFoundError;
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await getDatabasePool().execute(
      'INSERT INTO users (name, email, password, role, restaurant_id) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), normalizedEmail, passwordHash, normalizedRole, restaurantId]
    );

    return {
      id: result.insertId,
      name: name.trim(),
      email: normalizedEmail,
      role: normalizedRole,
      restaurantId
    };
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      const duplicateError = new Error('Email is already registered.');
      duplicateError.code = 'EMAIL_EXISTS';
      throw duplicateError;
    }

    console.error('[auth] registerUser failed:', error);
    console.error('[auth] registerUser stack:', error.stack);
    throw error;
  }
}

async function loginUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const [rows] = await getDatabasePool().execute(
    'SELECT id, name, email, password, role, restaurant_id AS restaurantId FROM users WHERE email = ? LIMIT 1',
    [normalizedEmail]
  );

  const user = rows[0];
  if (!user) {
    const authError = new Error('Invalid email or password.');
    authError.code = 'INVALID_CREDENTIALS';
    throw authError;
  }

  let passwordMatches;
  try {
    passwordMatches = await bcrypt.compare(password, user.password);
  } catch (error) {
    console.error('[auth] bcrypt.compare failed:', error);
    console.error('[auth] bcrypt.compare stack:', error.stack);
    throw error;
  }
  if (!passwordMatches) {
    const authError = new Error('Invalid email or password.');
    authError.code = 'INVALID_CREDENTIALS';
    throw authError;
  }

  let token;
  try {
    token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        restaurantId: user.restaurantId
      },
      getJwtSecret(),
      { expiresIn: '1d' }
    );
  } catch (error) {
    console.error('[auth] jwt.sign failed:', error);
    console.error('[auth] jwt.sign stack:', error.stack);
    throw error;
  }

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId
    }
  };
}

function getUserById(userId) {
  return getDatabasePool()
    .execute('SELECT id, name, email, role, restaurant_id AS restaurantId FROM users WHERE id = ? LIMIT 1', [userId])
    .then(([rows]) => rows[0] ?? null)
    .catch((error) => {
      console.error('[auth] MySQL profile lookup failed:', error);
      console.error('[auth] MySQL profile lookup stack:', error.stack);
      throw error;
    });
}

module.exports = {
  USER_ROLES,
  registerUser,
  loginUser,
  getUserById
};
