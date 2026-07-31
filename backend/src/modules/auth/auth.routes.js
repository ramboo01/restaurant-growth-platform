const express = require('express');
const { customerRegister, ownerRegister, internalRegister, login, profile, sendOtpHandler, verifyOtpHandler } = require('./auth.controller');
const { verifyJwt } = require('./jwt.middleware');
const { validate } = require('../../middleware/validate');
const { registerSchema, loginSchema } = require('../../validations/auth.validation');

const router = express.Router();

// Public: Customer signup only — role is always forced to 'Customer' on backend
router.post('/register', validate(registerSchema), customerRegister);

// Public: Owner signup — role is forced to 'Owner' on backend
router.post('/owner-register', validate(registerSchema), ownerRegister);

// Public: Login for all roles
router.post('/login', validate(loginSchema), login);

// Public: OTP routes for phone verification
router.post('/send-otp', sendOtpHandler);
router.post('/verify-otp', verifyOtpHandler);

// Protected: Only Admin/Owner can create Staff, Driver, Manager, Owner accounts
router.post('/internal-register', verifyJwt, internalRegister);

router.get('/profile', verifyJwt, profile);

module.exports = router;
