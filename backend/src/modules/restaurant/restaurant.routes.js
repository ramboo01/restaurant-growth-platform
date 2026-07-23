const express = require('express');
const { create, list, getById, update, remove } = require('./restaurant.controller');
const { validate } = require('../../middleware/validate');
const { restaurantSchema } = require('../../validations/restaurant.validation');

const router = express.Router();

router.post('/', validate(restaurantSchema), create);
router.get('/', list);
router.get('/:id', getById);
router.put('/:id', validate(restaurantSchema), update);
router.delete('/:id', remove);

module.exports = router;
