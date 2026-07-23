const Joi = require('joi');

const categorySchema = Joi.object({
  restaurantId: Joi.number().integer().positive().required(),
  name: Joi.string().trim().required(),
  displayOrder: Joi.number().integer().min(0).optional()
});

module.exports = {
  categorySchema
};
