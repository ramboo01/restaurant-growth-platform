const express = require('express');
const reportController = require('./report.controller');

const router = express.Router();

router.get('/sales', reportController.sales);
router.get('/menu', reportController.menu);
router.get('/staff', reportController.staff);
router.get('/summary', reportController.summary);
router.get('/revenue', reportController.revenue);
router.get('/orders', reportController.orders);
router.get('/top-items', reportController.topItems);
router.get('/revenue-recovery', reportController.revenueRecovery);

module.exports = router;

