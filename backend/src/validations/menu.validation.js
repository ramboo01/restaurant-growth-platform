const Joi = require('joi');

const menuSchema = Joi.object({
  restaurantId: Joi.number().integer().positive().optional(),
  name: Joi.string().trim().required(),
  description: Joi.string().trim().required(),
  category: Joi.string().trim().required(),
  price: Joi.number().positive().required(),
  imageUrl: Joi.string().trim().allow('', null).optional(),
  isAvailable: Joi.boolean().optional()
});

module.exports = {
  menuSchema
};
