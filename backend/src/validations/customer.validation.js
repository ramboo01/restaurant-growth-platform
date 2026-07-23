const Joi = require('joi');

const customerSchema = Joi.object({
  restaurantId: Joi.number().integer().positive().optional(),
  name: Joi.string().trim().required(),
  phone: Joi.string().trim().required(),
  email: Joi.string().trim().email({ tlds: false }).required(),
  totalOrders: Joi.number().integer().min(0).required(),
  totalSpent: Joi.number().min(0).required(),
  lastOrderAt: Joi.date().allow(null).optional()
});

module.exports = {
  customerSchema
};
