const Joi = require('joi');

const types = ['Info', 'Warning', 'Order', 'Payment', 'System'];

const notificationSchema = Joi.object({
  restaurantId: Joi.number().integer().positive().optional(),
  title: Joi.string().trim().required(),
  message: Joi.string().trim().required(),
  type: Joi.string().valid(...types).required(),
  isRead: Joi.boolean().optional()
});

module.exports = {
  notificationSchema
};
