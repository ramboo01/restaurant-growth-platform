const express = require('express');
const router = express.Router();
const campaignController = require('./campaign.controller');

router.get('/', campaignController.getCampaigns);
router.post('/', campaignController.createCampaign);
router.post('/:id/send', campaignController.sendCampaign);
router.delete('/:id', campaignController.deleteCampaign);

module.exports = router;
