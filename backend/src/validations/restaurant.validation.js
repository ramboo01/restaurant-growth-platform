const Joi = require('joi');

const restaurantSchema = Joi.object({
  name: Joi.string().trim().required(),
  phone: Joi.string().trim().required(),
  email: Joi.string().trim().email({ tlds: false }).required(),
  address: Joi.string().trim().required(),
  cuisine: Joi.string().trim().required(),
  openingTime: Joi.string().trim().required(),
  closingTime: Joi.string().trim().required()
});

module.exports = {
  restaurantSchema
};
