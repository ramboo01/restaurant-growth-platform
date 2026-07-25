const express = require('express');
const router = express.Router();
const campaignController = require('./campaign.controller');
const { authenticateToken } = require('../../middlewares/auth.middleware');

router.use(authenticateToken);

router.get('/', campaignController.getCampaigns);
router.post('/', campaignController.createCampaign);
router.post('/:id/send', campaignController.sendCampaign);
router.delete('/:id', campaignController.deleteCampaign);

module.exports = router;
