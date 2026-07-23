const Joi = require('joi');

const roles = ['Admin', 'Owner', 'Manager', 'Staff', 'Driver'];

const registerSchema = Joi.object({
  name: Joi.string().trim().required(),
  email: Joi.string().trim().email({ tlds: false }).required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid(...roles).default('Owner'),
  restaurantId: Joi.number().integer().positive().required()
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email({ tlds: false }).required(),
  password: Joi.string().required()
});

module.exports = {
  registerSchema,
  loginSchema
};
