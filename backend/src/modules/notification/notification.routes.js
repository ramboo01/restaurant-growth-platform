const express = require('express');
const notificationController = require('./notification.controller');
const { validate } = require('../../middleware/validate');
const { notificationSchema } = require('../../validations/notification.validation');

const router = express.Router();

router.post('/', validate(notificationSchema), notificationController.create);
router.get('/', notificationController.list);
router.get('/:id', notificationController.getById);
router.patch('/:id/read', notificationController.markRead);
router.delete('/:id', notificationController.remove);

module.exports = router;
