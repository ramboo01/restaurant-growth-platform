const Joi = require('joi');

const orderStatuses = ['Pending', 'Accepted', 'Preparing', 'Ready', 'Out for Delivery', 'Completed', 'Cancelled'];

const orderSchema = Joi.object({
  restaurantId: Joi.number().integer().positive().optional(),
  customerName: Joi.string().trim().required(),
  customerPhone: Joi.string().trim().required(),
  orderNumber: Joi.string().trim().required(),
  totalAmount: Joi.number().min(0).required(),
  orderStatus: Joi.string().valid(...orderStatuses).required(),
  paymentStatus: Joi.string().trim().required()
});

const orderStatusSchema = Joi.object({
  status: Joi.string().valid(...orderStatuses).required()
});

module.exports = {
  orderSchema,
  orderStatusSchema
};
