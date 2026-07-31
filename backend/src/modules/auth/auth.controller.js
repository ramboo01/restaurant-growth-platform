const { registerUser, loginUser, getUserById } = require('./auth.service');
const { sendSuccess, sendError } = require('../../utils/apiResponse');
const socketUtils = require('../../utils/socket');

// ─── PUBLIC: Customer self-registration only ───────────────────────────────
async function customerRegister(request, response, next) {
  try {
    const { name, email, password } = request.body;

    // Force role to Customer — ignore any role sent from frontend
    const user = await registerUser({ name, email, password, role: 'Customer' });

    try {
      const io = socketUtils.getIO();
      if (io) {
        io.emit('newCustomer', { user });
        if (user.restaurantId) {
          io.to(`restaurant_${user.restaurantId}`).emit('newCustomer', { user });
        }
      }
    } catch { /* socket fallback */ }

    return sendSuccess(response, {
      statusCode: 201,
      message: 'Account created successfully.',
      data: { user }
    });
  } catch (error) {
    console.error('[auth] customerRegister failed:', error);
    if (error.code === 'EMAIL_EXISTS') {
      error.statusCode = 409;
      return next(error);
    }
    return next(error);
  }
}

// ─── PUBLIC: Owner self-registration ────────────────────────────────────
async function ownerRegister(request, response, next) {
  try {
    const { name, email, password } = request.body;

    const user = await registerUser({ name, email, password, role: 'Owner' });

    return sendSuccess(response, {
      statusCode: 201,
      message: 'Owner account created successfully.',
      data: { user }
    });
  } catch (error) {
    console.error('[auth] ownerRegister failed:', error);
    if (error.code === 'EMAIL_EXISTS') {
      error.statusCode = 409;
      return next(error);
    }
    return next(error);
  }
}

// ─── PROTECTED: Internal staff/owner registration (Admin or Owner only) ────
async function internalRegister(request, response, next) {
  try {
    const callerRole = request.user?.role;

    // Only Admin or Owner can create internal accounts
    if (!['Admin', 'Owner'].includes(callerRole)) {
      return sendError(response, {
        statusCode: 403,
        message: 'Only Admins or Owners can create internal staff accounts.'
      });
    }

    const { name, email, password, role, restaurantId } = request.body;

    // Prevent creating another Admin unless caller is Admin
    if (role === 'Admin' && callerRole !== 'Admin') {
      return sendError(response, {
        statusCode: 403,
        message: 'Only Admins can create Admin accounts.'
      });
    }

    const user = await registerUser({ name, email, password, role, restaurantId });

    try {
      const io = socketUtils.getIO();
      if (io) {
        io.emit('userRegistered', { user });
        if (user.restaurantId) {
          io.to(`restaurant_${user.restaurantId}`).emit('userRegistered', { user });
        }
      }
    } catch { /* socket fallback */ }

    return sendSuccess(response, {
      statusCode: 201,
      message: `Internal account for ${user.name} (${user.role}) created successfully.`,
      data: { user }
    });
  } catch (error) {
    console.error('[auth] internalRegister failed:', error);
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

async function sendOtpHandler(request, response, next) {
  try {
    const { phone } = request.body;
    if (!phone || String(phone).replace(/\D/g, '').length !== 10) {
      return sendError(response, {
        statusCode: 400,
        message: 'Please provide a valid 10-digit mobile number.'
      });
    }

    const smsService = require('../../utils/smsService');
    const result = await smsService.generateAndSendOtp(phone);

    return sendSuccess(response, {
      statusCode: 200,
      message: result.message,
      data: {
        phone: result.phone,
        isLiveConfigured: result.isLiveConfigured,
        testOtp: result.testOtp
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function verifyOtpHandler(request, response, next) {
  try {
    const { phone, otp } = request.body;
    if (!phone || !otp) {
      return sendError(response, {
        statusCode: 400,
        message: 'Mobile number and OTP are required.'
      });
    }

    const smsService = require('../../utils/smsService');
    const result = smsService.verifyOtp(phone, otp);

    if (!result.success) {
      return sendError(response, {
        statusCode: 400,
        message: result.message
      });
    }

    return sendSuccess(response, {
      statusCode: 200,
      message: result.message,
      data: { verified: true }
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  customerRegister,
  ownerRegister,
  internalRegister,
  login,
  profile,
  sendOtpHandler,
  verifyOtpHandler
};
