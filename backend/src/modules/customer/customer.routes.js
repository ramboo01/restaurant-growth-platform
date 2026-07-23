const express = require('express');
const customerController = require('./customer.controller');
const { validate } = require('../../middleware/validate');
const { customerSchema } = require('../../validations/customer.validation');

const router = express.Router();

router.post('/', validate(customerSchema), customerController.create);
router.get('/', customerController.list);
router.get('/:id', customerController.getById);
router.put('/:id', validate(customerSchema), customerController.update);
router.delete('/:id', customerController.remove);

module.exports = router;
