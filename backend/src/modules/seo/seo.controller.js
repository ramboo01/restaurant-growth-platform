const seoService = require('./seo.service');

async function getSeoSettingsHandler(req, res) {
  try {
    const restaurantId = req.user.restaurantId || 1;
    const settings = await seoService.getSeoSettings(restaurantId);
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('getSeoSettingsHandler error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function updateSeoSettingsHandler(req, res) {
  try {
    const restaurantId = req.user.restaurantId || 1;
    const settings = await seoService.updateSeoSettings(restaurantId, req.body);
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('updateSeoSettingsHandler error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function generateAiSeoMetaHandler(req, res) {
  try {
    const restaurantId = req.user?.restaurantId || 1;
    const aiMeta = await seoService.generateAiSeoMeta(restaurantId, req.body);
    res.json({ success: true, data: aiMeta });
  } catch (error) {
    console.error('generateAiSeoMetaHandler error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function getPublicSeoHandler(req, res) {
  try {
    const restaurantId = Number(req.query.restaurantId) || 1;
    const settings = await seoService.getSeoSettings(restaurantId);
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('getPublicSeoHandler error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function getSitemapHandler(req, res) {
  try {
    const restaurantId = Number(req.query.restaurantId) || 1;
    const xml = await seoService.generateSitemapXml(restaurantId);
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('getSitemapHandler error:', error);
    res.status(500).send('<error>Failed to generate sitemap</error>');
  }
}

module.exports = {
  getSeoSettingsHandler,
  updateSeoSettingsHandler,
  generateAiSeoMetaHandler,
  getPublicSeoHandler,
  getSitemapHandler
};
