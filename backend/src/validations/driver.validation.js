const Joi = require('joi');

const statuses = ['Active', 'On Delivery', 'Off Duty'];

const driverSchema = Joi.object({
  restaurantId: Joi.number().integer().positive().optional(),
  name: Joi.string().trim().required(),
  phone: Joi.string().trim().required(),
  vehicleNumber: Joi.string().trim().required(),
  licenseNumber: Joi.string().trim().required(),
  status: Joi.string().valid(...statuses).required()
});

module.exports = {
  driverSchema
};
