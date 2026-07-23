const express = require('express');
const driverController = require('./driver.controller');
const { validate } = require('../../middleware/validate');
const { driverSchema } = require('../../validations/driver.validation');

const router = express.Router();

router.post('/', validate(driverSchema), driverController.create);
router.get('/', driverController.list);
router.get('/:id', driverController.getById);
router.put('/:id', validate(driverSchema), driverController.update);
router.delete('/:id', driverController.remove);

module.exports = router;
