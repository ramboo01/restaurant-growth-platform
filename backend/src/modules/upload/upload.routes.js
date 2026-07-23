const express = require('express');
const { uploadMenuImage: upload } = require('../../middleware/upload');
const uploadController = require('./upload.controller');
const { authorize } = require('../../middleware/authorize');

const router = express.Router();

router.post('/menu-image', authorize('Owner', 'Admin', 'Manager'), upload.single('image'), uploadController.uploadMenuImage);

module.exports = router;
