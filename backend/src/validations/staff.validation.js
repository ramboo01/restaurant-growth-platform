const Joi = require('joi');

const roles = ['Manager', 'Chef', 'Cashier', 'Waiter', 'Delivery Driver'];
const statuses = ['Active', 'On Leave'];

const staffSchema = Joi.object({
  restaurantId: Joi.number().integer().positive().optional(),
  name: Joi.string().trim().required(),
  role: Joi.string().valid(...roles).required(),
  phone: Joi.string().trim().required(),
  email: Joi.string().trim().email({ tlds: false }).required(),
  shift: Joi.string().trim().required(),
  status: Joi.string().valid(...statuses).required()
});

module.exports = {
  staffSchema
};
