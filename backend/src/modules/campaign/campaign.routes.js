const express = require('express');
const router = express.Router();
const campaignController = require('./campaign.controller');
const { authorize } = require('../../middleware/authorize');
const { verifyRestaurantOwnership } = require('../../middleware/restaurantOwnership');

// Public route: Validate promo code (Guest/Customer checkout)
router.post('/validate-promo', campaignController.validatePromoCode);

// Protected routes: Require auth & ownership verification
router.use(authorize('Admin', 'Owner', 'Manager'), verifyRestaurantOwnership);

router.get('/', campaignController.getCampaigns);
router.post('/', campaignController.createCampaign);
router.post('/:id/send', campaignController.sendCampaign);
router.delete('/:id', campaignController.deleteCampaign);

module.exports = router;
