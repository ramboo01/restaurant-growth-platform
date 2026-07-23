const express = require('express');
const staffController = require('./staff.controller');
const { validate } = require('../../middleware/validate');
const { staffSchema } = require('../../validations/staff.validation');

const router = express.Router();

router.post('/', validate(staffSchema), staffController.create);
router.get('/', staffController.list);
router.get('/:id', staffController.getById);
router.put('/:id', validate(staffSchema), staffController.update);
router.delete('/:id', staffController.remove);

module.exports = router;
