const express = require('express');
const { create, list, getById, update, remove, updateStatus } = require('./order.controller');
const { validate } = require('../../middleware/validate');
const { orderSchema, orderStatusSchema } = require('../../validations/order.validation');

const router = express.Router();

router.post('/', validate(orderSchema), create);
router.get('/', list);
router.get('/:id', getById);
router.put('/:id', validate(orderSchema), update);
router.delete('/:id', remove);
router.patch('/:id/status', validate(orderStatusSchema), updateStatus);

module.exports = router;
