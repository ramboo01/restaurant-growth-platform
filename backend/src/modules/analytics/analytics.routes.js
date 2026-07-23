const express = require('express');
const analyticsController = require('./analytics.controller');

const router = express.Router();

router.get('/dashboard', analyticsController.dashboard);

module.exports = router;
