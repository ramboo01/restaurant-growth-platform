const express = require('express');
const { create, list, getById, update, remove } = require('./category.controller');
const { validate } = require('../../middleware/validate');
const { categorySchema } = require('../../validations/category.validation');

const router = express.Router();

router.post('/', validate(categorySchema), create);
router.get('/', list);
router.get('/:id', getById);
router.put('/:id', validate(categorySchema), update);
router.delete('/:id', remove);

module.exports = router;
