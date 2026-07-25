const campaignService = require('./campaign.service');

async function getCampaigns(req, res, next) {
  try {
    const restaurantId = req.user.restaurantId || 1;
    const campaigns = await campaignService.getCampaigns(restaurantId);
    res.json({ success: true, data: campaigns });
  } catch (err) {
    next(err);
  }
}

async function createCampaign(req, res, next) {
  try {
    const restaurantId = req.user.restaurantId || 1;
    const campaign = await campaignService.createCampaign({
      ...req.body,
      restaurantId
    });
    res.status(201).json({ success: true, data: campaign });
  } catch (err) {
    next(err);
  }
}

async function sendCampaign(req, res, next) {
  try {
    const restaurantId = req.user.restaurantId || 1;
    const { id } = req.params;
    const campaign = await campaignService.sendCampaign(id, restaurantId);
    res.json({ success: true, data: campaign });
  } catch (err) {
    next(err);
  }
}

async function deleteCampaign(req, res, next) {
  try {
    const restaurantId = req.user.restaurantId || 1;
    const { id } = req.params;
    await campaignService.deleteCampaign(id, restaurantId);
    res.json({ success: true, message: 'Campaign deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCampaigns,
  createCampaign,
  sendCampaign,
  deleteCampaign
};
