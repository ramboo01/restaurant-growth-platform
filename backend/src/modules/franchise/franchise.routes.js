const express = require('express');
const franchiseController = require('./franchise.controller');
const { verifyRestaurantOwnership } = require('../../middleware/restaurantOwnership');

const router = express.Router();

// Get all restaurants this owner has access to
router.get('/my-restaurants', franchiseController.getMyRestaurants);

// Get franchise comparison data
router.get('/comparison-data', franchiseController.getFranchiseComparison);

// Update a restaurant's status (Active/Inactive/Suspended)
router.patch('/:restaurantId/status', franchiseController.updateStatus);

// Franchise compliance settings (GET/PUT)
router.get('/settings', franchiseController.getSettings);
router.put('/settings', franchiseController.saveSettings);

// Switch active restaurant context
router.post('/switch', franchiseController.switchRestaurant);

// Sync menu from active restaurant to all branches
router.post('/sync-menu', franchiseController.syncMenu);

// Financial Settings & Catering Installments
router.get('/financial-settings', verifyRestaurantOwnership, franchiseController.getFinancialSettings);
router.put('/financial-settings', verifyRestaurantOwnership, franchiseController.saveFinancialSettings);
router.get('/catering-installments', verifyRestaurantOwnership, franchiseController.getCateringInstallments);

module.exports = router;
