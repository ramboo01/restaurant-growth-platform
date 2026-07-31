const campaignService = require('./campaign.service');

async function getCampaigns(req, res, next) {
  try {
    const restaurantId = req.user?.restaurantId || req.user?.restaurant_id || 1;
    const campaigns = await campaignService.getCampaigns(restaurantId);
    res.json({ success: true, data: campaigns });
  } catch (err) {
    next(err);
  }
}

async function createCampaign(req, res, next) {
  try {
    const restaurantId = req.user?.restaurantId || req.user?.restaurant_id || 1;
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
    const restaurantId = req.user?.restaurantId || req.user?.restaurant_id || 1;
    const { id } = req.params;
    const campaign = await campaignService.sendCampaign(id, restaurantId);
    res.json({ success: true, data: campaign });
  } catch (err) {
    next(err);
  }
}

async function deleteCampaign(req, res, next) {
  try {
    const restaurantId = req.user?.restaurantId || req.user?.restaurant_id || 1;
    const { id } = req.params;
    await campaignService.deleteCampaign(id, restaurantId);
    res.json({ success: true, message: 'Campaign deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

async function validatePromoCode(req, res, next) {
  try {
    const restaurantId = req.query.restaurantId || req.body.restaurantId || 1;
    const { code, subtotal } = req.body.code ? req.body : req.query;
    const result = await campaignService.validatePromoCode(code, restaurantId, subtotal);
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message });
    }
    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCampaigns,
  createCampaign,
  sendCampaign,
  deleteCampaign,
  validatePromoCode
};
