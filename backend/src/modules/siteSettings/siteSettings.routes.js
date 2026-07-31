const express = require('express');
const siteSettingsController = require('./siteSettings.controller');
const { authorize } = require('../../middleware/authorize');

const router = express.Router();

// Public endpoint for guest storefront
router.get('/public', siteSettingsController.getPublicSiteSettings);

// Protected endpoints for restaurant owner
router.get('/owner', authorize('Owner', 'Admin', 'Marketing'), siteSettingsController.getOwnerSiteSettings);
router.put('/owner', authorize('Owner', 'Admin', 'Marketing'), siteSettingsController.updateSiteSettings);

module.exports = router;
