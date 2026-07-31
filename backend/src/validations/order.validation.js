const Joi = require('joi');

const orderStatuses = ['Pending', 'Accepted', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered', 'Completed', 'Cancelled'];

const orderSchema = Joi.object({
  restaurantId: Joi.number().integer().positive().optional(),
  customerName: Joi.string().trim().required(),
  customerPhone: Joi.string().trim().required(),
  orderNumber: Joi.string().trim().required(),
  totalAmount: Joi.number().min(0).required(),
  orderStatus: Joi.string().valid(...orderStatuses).required(),
  paymentStatus: Joi.string().trim().required(),
  items: Joi.array().optional(),
  fulfillmentDetails: Joi.object().optional(),
  specialInstructions: Joi.string().allow('', null).optional()
});

const orderStatusSchema = Joi.object({
  status: Joi.string().valid(...orderStatuses).required(),
  otp: Joi.string().allow('', null).optional()
}).unknown(true);

module.exports = {
  orderSchema,
  orderStatusSchema
};
