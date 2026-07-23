const express = require('express');
const { register, login, profile } = require('./auth.controller');
const { verifyJwt } = require('./jwt.middleware');
const { validate } = require('../../middleware/validate');
const { registerSchema, loginSchema } = require('../../validations/auth.validation');

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/profile', verifyJwt, profile);

module.exports = router;
