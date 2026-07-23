const express = require('express');
const { create, list, getById, update, remove, listByRestaurant } = require('./menu.controller');
const { validate } = require('../../middleware/validate');
const { menuSchema } = require('../../validations/menu.validation');

const router = express.Router();

router.post('/', validate(menuSchema), create);
router.get('/', list);
router.get('/:id', getById);
router.put('/:id', validate(menuSchema), update);
router.delete('/:id', remove);

module.exports = router;
