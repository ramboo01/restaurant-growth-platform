const express = require('express');
const router = express.Router();
const deliveryController = require('./delivery.controller');
const { verifyJwt } = require('../auth/jwt.middleware');

// Public route for storefront checkout calculations
router.get('/public', deliveryController.getPublicDeliveryConfig);
router.get('/public/:restaurantId', deliveryController.getPublicDeliveryConfig);

// Owner protected routes
router.get('/', verifyJwt, deliveryController.getDeliveryConfig);
router.put('/', verifyJwt, deliveryController.updateDeliveryConfig);

// Driver location update endpoint
router.post('/location', deliveryController.updateDriverLocation);

module.exports = router;
