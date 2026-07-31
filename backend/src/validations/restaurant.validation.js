const Joi = require('joi');

const restaurantSchema = Joi.object({
  name: Joi.string().trim().required(),
  phone: Joi.string().trim().required(),
  email: Joi.string().trim().email({ tlds: false }).required(),
  address: Joi.string().trim().required(),
  cuisine: Joi.string().trim().required(),
  openingTime: Joi.string().trim().required(),
  closingTime: Joi.string().trim().required(),

  weeklySchedule: Joi.string().trim().optional(),
  gst: Joi.number().optional(),
  serviceCharge: Joi.number().optional(),
  deliveryRadius: Joi.number().optional(),
  minimumOrderAmount: Joi.number().optional(),
  deliveryFee: Joi.number().optional(),
  freeDeliveryThreshold: Joi.number().optional(),
  cash: Joi.boolean().optional(),
  card: Joi.boolean().optional(),
  upi: Joi.boolean().optional(),
  wallet: Joi.boolean().optional(),
  primaryColor: Joi.string().trim().optional(),
  secondaryColor: Joi.string().trim().optional(),
  emailNotifications: Joi.boolean().optional(),
  smsNotifications: Joi.boolean().optional(),
  pushNotifications: Joi.boolean().optional(),
  logoUrl: Joi.string().trim().allow(null, '').optional(),
  bannerUrl: Joi.string().trim().allow(null, '').optional()
});

module.exports = {
  restaurantSchema
};
