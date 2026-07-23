const Joi = require('joi');

const tiers = ['Bronze', 'Silver', 'Gold', 'Platinum'];

const loyaltySchema = Joi.object({
  restaurantId: Joi.number().integer().positive().required(),
  customerName: Joi.string().trim().required(),
  phone: Joi.string().trim().required(),
  points: Joi.number().integer().min(0).required(),
  tier: Joi.string().valid(...tiers).required()
});

module.exports = {
  loyaltySchema
};
