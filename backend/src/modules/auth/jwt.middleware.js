const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../config/env');
const { getUserById } = require('./auth.service');

async function verifyJwt(request, response, next) {
  const authorization = request.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    const error = new Error('Missing authorization token.');
    error.statusCode = 401;
    return next(error);
  }

  if (!JWT_SECRET) {
    const error = new Error('JWT_SECRET is missing from environment variables.');
    error.statusCode = 500;
    return next(error);
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await getUserById(payload.sub);

    if (!user) {
      const error = new Error('Authenticated user no longer exists.');
      error.statusCode = 401;
      return next(error);
    }

    request.user = {
      ...payload,
      id: user.id,
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId
    };

    return next();
  } catch (error) {
    console.error('[auth] jwt verification failed:', error);
    console.error('[auth] jwt verification stack:', error.stack);
    return next(error);
  }
}

module.exports = {
  verifyJwt
};
