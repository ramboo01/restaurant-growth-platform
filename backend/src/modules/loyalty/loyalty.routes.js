const express = require('express');
const loyaltyController = require('./loyalty.controller');
const { validate } = require('../../middleware/validate');
const { loyaltySchema } = require('../../validations/loyalty.validation');

const router = express.Router();

router.get('/summary', loyaltyController.getSummary);
router.get('/rewards', loyaltyController.listRewards);
router.post('/rewards', loyaltyController.addReward);
router.put('/rewards/:id', loyaltyController.editReward);
router.delete('/rewards/:id', loyaltyController.removeReward);

router.post('/', validate(loyaltySchema), loyaltyController.create);
router.get('/', loyaltyController.list);
router.get('/:id', loyaltyController.getById);
router.put('/:id', validate(loyaltySchema), loyaltyController.update);
router.delete('/:id', loyaltyController.remove);

module.exports = router;
