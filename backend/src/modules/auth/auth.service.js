const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../config/env');
const { getDatabasePool } = require('../../config/database');

const USER_ROLES = ['Admin', 'Owner', 'Manager', 'Staff', 'Driver', 'Customer'];
const INTERNAL_ROLES = ['Admin', 'Owner', 'Manager', 'Staff', 'Driver'];

function getJwtSecret() {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is missing from environment variables.');
  }
  return JWT_SECRET;
}

function normalizeRole(role) {
  return role || 'Customer';
}

async function registerUser({ name, email, password, role, restaurantId }) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedRole = normalizeRole(role);

  try {
    let finalRestaurantId = restaurantId ? Number(restaurantId) : null;
    if (finalRestaurantId) {
      const [restaurants] = await getDatabasePool().execute(
        'SELECT id FROM restaurants WHERE id = ? LIMIT 1',
        [finalRestaurantId]
      );
      if (restaurants.length === 0) {
        finalRestaurantId = null;
      }
    }

    if (!finalRestaurantId) {
      const [existingRest] = await getDatabasePool().execute('SELECT id FROM restaurants LIMIT 1');
      if (existingRest.length > 0) {
        finalRestaurantId = existingRest[0].id;
      } else {
        const [newRest] = await getDatabasePool().execute(
          'INSERT INTO restaurants (name, phone, email, address, cuisine, opening_time, closing_time) VALUES (?, ?, ?, ?, ?, ?, ?)',
          ['My Restaurant', '555-0100', 'owner@restaurant.com', '123 Main St', 'General', '08:00:00', '22:00:00']
        );
        finalRestaurantId = newRest.insertId;
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await getDatabasePool().execute(
      'INSERT INTO users (name, email, password, role, restaurant_id) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), normalizedEmail, passwordHash, normalizedRole, finalRestaurantId]
    );

    // Auto-create Guest CRM profile if role is Customer
    if (normalizedRole === 'Customer') {
      try {
        const [existingCust] = await getDatabasePool().execute(
          'SELECT id FROM customers WHERE restaurant_id = ? AND email = ? LIMIT 1',
          [finalRestaurantId, normalizedEmail]
        );
        if (existingCust.length === 0) {
          await getDatabasePool().execute(
            `INSERT INTO customers (restaurant_id, name, phone, email, total_orders, total_spent, segment)
             VALUES (?, ?, ?, ?, 0, 0.00, 'New')`,
            [finalRestaurantId, name.trim(), '', normalizedEmail]
          );
        }
      } catch (custErr) {
        console.warn('[auth] Failed to auto-create customer CRM profile:', custErr.message);
      }
    }

    return {
      id: result.insertId,
      name: name.trim(),
      email: normalizedEmail,
      role: normalizedRole,
      restaurantId: finalRestaurantId
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
    'SELECT id, name, email, password, role, restaurant_id AS restaurantId, is_blocked, blocked_reason FROM users WHERE email = ? LIMIT 1',
    [normalizedEmail]
  );

  const user = rows[0];
  if (!user) {
    const authError = new Error('Invalid email or password.');
    authError.code = 'INVALID_CREDENTIALS';
    throw authError;
  }

  if (user.is_blocked) {
    const blockedError = new Error(`Your account has been blocked by the administrator. Reason: ${user.blocked_reason || 'Security Policy'}`);
    blockedError.code = 'ACCOUNT_BLOCKED';
    throw blockedError;
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

  // Update last_login_at timestamp
  await getDatabasePool().execute(
    'UPDATE users SET last_login_at = NOW() WHERE id = ?',
    [user.id]
  ).catch(() => {});

  // Fetch all restaurants this user can access
  let accessibleRestaurants = [];
  try {
    const [restRows] = await getDatabasePool().execute(
      `SELECT r.id, r.name, r.status, ur.is_primary AS isPrimary
       FROM user_restaurants ur
       JOIN restaurants r ON ur.restaurant_id = r.id
       WHERE ur.user_id = ?
       ORDER BY ur.is_primary DESC, r.name ASC`,
      [user.id]
    );
    accessibleRestaurants = restRows;
  } catch {
    // Table might not exist yet — graceful fallback
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
      restaurantId: user.restaurantId,
      accessibleRestaurants
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
