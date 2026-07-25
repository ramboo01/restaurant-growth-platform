const express = require('express');
const router = express.Router();
const seoController = require('./seo.controller');

router.get('/', seoController.getSeoSettingsHandler);
router.put('/', seoController.updateSeoSettingsHandler);
router.post('/ai-meta', seoController.generateAiSeoMetaHandler);

module.exports = router;
