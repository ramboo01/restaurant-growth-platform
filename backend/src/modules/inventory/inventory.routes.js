const express = require('express');
const inventoryController = require('./inventory.controller');
const { validate } = require('../../middleware/validate');
const { inventorySchema } = require('../../validations/inventory.validation');

const router = express.Router();

router.post('/', validate(inventorySchema), inventoryController.create);
router.get('/', inventoryController.list);
router.get('/:id', inventoryController.getById);
router.put('/:id', validate(inventorySchema), inventoryController.update);
router.delete('/:id', inventoryController.remove);

module.exports = router;
