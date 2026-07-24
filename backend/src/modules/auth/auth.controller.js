const { registerUser, loginUser, getUserById } = require('./auth.service');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

async function register(request, response, next) {
  try {
    const { name, email, password, role, restaurantId } = request.body;
    const user = await registerUser({ name, email, password, role, restaurantId });
    return sendSuccess(response, {
      statusCode: 201,
      message: 'User registered successfully.',
      data: { user }
    });
  } catch (error) {
    console.error('[auth] register failed:', error);
    console.error('[auth] register stack:', error.stack);
    if (error.code === 'EMAIL_EXISTS') {
      error.statusCode = 409;
      return next(error);
    }

    return next(error);
  }
}

async function login(request, response, next) {
  try {
    const { email, password } = request.body;
    const result = await loginUser({ email, password });
    return sendSuccess(response, {
      statusCode: 200,
      message: 'Login successful.',
      data: result
    });
  } catch (error) {
    console.error('[auth] login failed:', error);
    console.error('[auth] login stack:', error.stack);
    if (error.code === 'INVALID_CREDENTIALS') {
      error.statusCode = 401;
      return next(error);
    }

    return next(error);
  }
}

async function profile(request, response, next) {
  try {
    const user = await getUserById(request.user.sub);
    if (!user) {
      return sendError(response, {
        statusCode: 404,
        message: 'User not found.'
      });
    }

    return sendSuccess(response, {
      statusCode: 200,
      message: 'Profile fetched successfully.',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          restaurantId: user.restaurantId
        }
      }
    });
  } catch (error) {
    console.error('[auth] profile failed:', error);
    console.error('[auth] profile stack:', error.stack);
    return next(error);
  }
}

module.exports = {
  register,
  login,
  profile
};
