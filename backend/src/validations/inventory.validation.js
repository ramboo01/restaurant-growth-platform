const Joi = require('joi');

const statuses = ['In Stock', 'Low Stock', 'Out of Stock'];

const inventorySchema = Joi.object({
  restaurantId: Joi.number().integer().positive().optional(),
  itemName: Joi.string().trim().required(),
  category: Joi.string().trim().required(),
  unit: Joi.string().trim().required(),
  quantity: Joi.number().min(0).required(),
  minimumQuantity: Joi.number().min(0).required(),
  supplier: Joi.string().trim().required(),
  status: Joi.string().valid(...statuses).required()
});

module.exports = {
  inventorySchema
};
