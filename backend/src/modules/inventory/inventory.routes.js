const express = require('express');
const inventoryController = require('./inventory.controller');
const { validate } = require('../../middleware/validate');
const { inventorySchema } = require('../../validations/inventory.validation');

const router = express.Router();

// Transaction routes (must be before /:id)
router.get('/transactions', inventoryController.transactionHistory);
router.get('/transactions/summary', inventoryController.transactionSummary);

// Item CRUD
router.post('/', validate(inventorySchema), inventoryController.create);
router.get('/', inventoryController.list);
router.get('/:id', inventoryController.getById);
router.put('/:id', validate(inventorySchema), inventoryController.update);
router.delete('/:id', inventoryController.remove);

// Transaction actions on specific item
router.post('/:id/stock-in', inventoryController.stockIn);
router.post('/:id/usage', inventoryController.recordUsage);
router.post('/:id/wastage', inventoryController.recordWastage);
router.post('/:id/adjustment', inventoryController.adjustStock);

module.exports = router;

