const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const { checkDatabaseConnection } = require('./config/database');
const swaggerSpec = require('./config/swagger');
const { authorize } = require('./middleware/authorize');
const { verifyRestaurantOwnership } = require('./middleware/restaurantOwnership');
const { errorHandler } = require('./middleware/errorHandler');
const { FRONTEND_URL } = require('./config/env');
const authRoutes = require('./modules/auth/auth.routes');
const restaurantRoutes = require('./modules/restaurant/restaurant.routes');
const menuRoutes = require('./modules/menu/menu.routes');
const categoryRoutes = require('./modules/category/category.routes');
const orderRoutes = require('./modules/order/order.routes');
const staffRoutes = require('./modules/staff/staff.routes');
const driverRoutes = require('./modules/driver/driver.routes');
const inventoryRoutes = require('./modules/inventory/inventory.routes');
const loyaltyRoutes = require('./modules/loyalty/loyalty.routes');
const analyticsRoutes = require('./modules/analytics/analytics.routes');
const customerRoutes = require('./modules/customer/customer.routes');
const notificationRoutes = require('./modules/notification/notification.routes');
const reportRoutes = require('./modules/reports/report.routes');
const supplierRoutes = require('./modules/supplier/supplier.routes');
const campaignRoutes = require('./modules/campaign/campaign.routes');
const uploadRoutes = require('./modules/upload/upload.routes');
const publicRoutes = require('./modules/public/public.routes');
const reviewRoutes = require('./modules/review/review.routes');
const seoRoutes = require('./modules/seo/seo.routes');
const deliveryRoutes = require('./modules/delivery/delivery.routes');
const aiRoutes = require('./modules/ai/ai.routes');
const franchiseRoutes = require('./modules/franchise/franchise.routes');

const app = express();
const allowedOrigins = FRONTEND_URL
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const isProduction = process.env.NODE_ENV === 'production';
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 100 : 100000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    errors: []
  }
});
const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }

    return callback(new Error('CORS origin is not allowed.'));
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: false
}));
app.use(compression());
app.use(apiLimiter);
app.use(express.json({ limit: '1mb' }));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/restaurants', authorize('Admin', 'Owner'), restaurantRoutes);
app.use('/api/menu', authorize('Owner', 'Manager'), verifyRestaurantOwnership, menuRoutes);
app.use('/api/categories', authorize('Owner', 'Manager'), categoryRoutes);
app.use('/api/orders', authorize('Owner', 'Manager', 'Staff', 'Driver'), verifyRestaurantOwnership, orderRoutes);
app.use('/api/staff', authorize('Admin', 'Owner'), verifyRestaurantOwnership, staffRoutes);
app.use('/api/drivers', authorize('Owner', 'Driver'), verifyRestaurantOwnership, driverRoutes);
app.use('/api/inventory', authorize('Admin', 'Owner', 'Manager', 'Staff'), verifyRestaurantOwnership, inventoryRoutes);
app.use('/api/loyalty', authorize('Admin', 'Owner', 'Manager'), loyaltyRoutes);
app.use('/api/analytics', authorize('Admin', 'Owner', 'Manager'), verifyRestaurantOwnership, analyticsRoutes);
app.use('/api/customers', authorize('Admin', 'Owner', 'Manager', 'Staff'), verifyRestaurantOwnership, customerRoutes);
app.use('/api/notifications', authorize('Owner', 'Manager', 'Admin', 'Staff', 'Driver'), verifyRestaurantOwnership, notificationRoutes);
app.use('/api/reports', authorize('Admin', 'Owner'), verifyRestaurantOwnership, reportRoutes);
app.use('/api/suppliers', authorize('Admin', 'Owner', 'Manager'), verifyRestaurantOwnership, supplierRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/reviews', authorize('Admin', 'Owner', 'Manager'), verifyRestaurantOwnership, reviewRoutes);
app.use('/api/seo', authorize('Admin', 'Owner', 'Manager'), verifyRestaurantOwnership, seoRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/ai', authorize('Admin', 'Owner', 'Manager'), verifyRestaurantOwnership, aiRoutes);
app.use('/api/franchise', authorize('Admin', 'Owner'), franchiseRoutes);
app.use('/api/upload', uploadRoutes);

// Customer-facing notification endpoints (no restaurant ownership required)
const customerNotificationRoutes = require('./modules/customerNotification/customerNotification.routes');
app.use('/api/customer/notifications', customerNotificationRoutes);

// Site Settings CMS (OWN-007)
const siteSettingsRoutes = require('./modules/siteSettings/siteSettings.routes');
app.use('/api/site-settings', siteSettingsRoutes);

// Guest Privacy Preferences (GST-009) & Data Export (OWN-030)
const guestPrivacyController = require('./modules/customer/guestPrivacy.controller');
app.get('/api/customer/preferences', authorize('Customer', 'Owner', 'Admin'), guestPrivacyController.getGuestPreferences);
app.put('/api/customer/preferences', authorize('Customer', 'Owner', 'Admin'), guestPrivacyController.updateGuestPreferences);
app.post('/api/customer/privacy/erasure-request', authorize('Customer', 'Owner', 'Admin'), guestPrivacyController.requestErasure);
app.get('/api/owner/data-export', authorize('Owner', 'Admin'), guestPrivacyController.exportRestaurantData);

// Catering Module (dedicated system — separate from regular orders)
const newCateringController = require('./modules/catering/catering.controller');
app.post('/api/catering/request', newCateringController.submitCateringRequest);
app.get('/api/catering/my-orders', newCateringController.getMyOrders);
app.get('/api/catering/restaurant/:restaurantId', authorize('Owner', 'Admin', 'Manager'), newCateringController.getRestaurantOrders);
app.patch('/api/catering/:id/status', authorize('Owner', 'Admin', 'Manager'), newCateringController.updateOrderStatus);
app.patch('/api/catering/:id/notes', authorize('Owner', 'Admin', 'Manager'), newCateringController.updateOrderNotes);
app.get('/api/catering/staff/:restaurantId', authorize('Owner', 'Admin', 'Manager', 'Staff'), newCateringController.getStaffEvents);

// Shifts & Scheduling (OWN-015, OWN-016, ST-006)
const shiftsController = require('./modules/shifts/shifts.controller');
app.get('/api/shifts/owner', shiftsController.getOwnerShifts);
app.post('/api/shifts/owner', shiftsController.createShift);
app.get('/api/shifts/open', shiftsController.getOpenShifts);
app.post('/api/shifts/claim/:id', shiftsController.claimShift);

// Franchise Compliance & Price Overrides (OWN-024)
const franchiseComplianceController = require('./modules/franchise/franchiseCompliance.controller');
app.get('/api/franchise/compliance-data', franchiseComplianceController.getFranchiseComplianceData);
app.post('/api/franchise/price-override/action', franchiseComplianceController.handlePriceOverrideAction);

// Platform Admin Endpoints (ADM-001, ADM-002, ADM-005, ADM-007)
const adminController = require('./modules/admin/admin.controller');
const supportController = require('./modules/support/support.controller');

// Support & Tickets API Routes
app.post('/api/owner/support/tickets', supportController.createOwnerTicket);
app.get('/api/owner/support/tickets', supportController.getOwnerTickets);
app.get('/api/admin/support/tickets', supportController.getAdminTickets);
app.post('/api/admin/support/respond-ticket', supportController.respondAndResolveTicket);

// Onboarding Specialist API Routes
app.get('/api/admin/onboarding/list', adminController.getOnboardingList);
app.post('/api/admin/onboarding/update-step', adminController.updateOnboardingStep);
app.post('/api/admin/onboarding/go-live', adminController.activateStoreGoLive);

app.get('/api/admin/privacy/requests', adminController.getPrivacyRequests);
app.post('/api/admin/privacy/process-erasure', adminController.processErasureRequest);
app.post('/api/admin/privacy/merge-profiles', adminController.mergeProfiles);
app.post('/api/admin/privacy/separate-profiles', adminController.separateProfiles);

// Guest Graph Intelligence Routes
app.get('/api/admin/guest-graph/candidates', adminController.getGuestGraphCandidates);
app.post('/api/admin/guest-graph/review-candidate', adminController.reviewGuestGraphCandidate);
app.get('/api/admin/guest-graph/history', adminController.getGuestGraphHistory);
app.post('/api/admin/guest-graph/revert-merge', adminController.revertGuestGraphMerge);
app.get('/api/admin/financial/payouts', adminController.getStorePayouts);
app.post('/api/admin/financial/release-payout', adminController.releasePayout);
app.post('/api/admin/financial/recalculate', adminController.recalculateStorePayouts);
app.get('/api/admin/audit-logs', adminController.getAuditLogs);
app.post('/api/admin/broadcast', adminController.broadcastAnnouncement);
app.get('/api/admin/users', adminController.getUsers);
app.patch('/api/admin/users/:id/role', adminController.updateUserRole);
app.get('/api/admin/reports/summary', adminController.getPlatformReportsSummary);
app.get('/api/admin/system/health', adminController.getSystemHealthStatus);
app.post('/api/admin/system/ping', adminController.pingInfrastructureService);
app.get('/api/admin/security/settings', adminController.getSecuritySettings);
app.post('/api/admin/security/2fa-toggle', adminController.toggle2FAEnforcement);
app.post('/api/admin/security/revoke-session', adminController.revokeUserSession);
app.post('/api/admin/security/block-user', adminController.blockUser);
app.post('/api/admin/security/unblock-user', adminController.unblockUser);

// Sprint 5 Endpoints (ADM-003, ADM-004, ADM-006, ST-001, ST-009, ST-010)
const sprint5Controller = require('./modules/admin/sprint5.controller');
app.get('/api/admin/channels', sprint5Controller.getChannels);
app.post('/api/admin/channels/sync', sprint5Controller.forceSyncChannel);
app.post('/api/admin/channels/configure', sprint5Controller.configureChannel);
app.get('/api/admin/circuit-breakers', sprint5Controller.getCircuitBreakers);
app.post('/api/admin/circuit-breakers/reset', sprint5Controller.resetCircuitBreaker);

app.get('/api/admin/reconciliations', async (req, res, next) => {
  try {
    const { getReconciliationLogs } = require('./modules/order/reconciliation.service');
    const logs = await getReconciliationLogs(req.query);
    return res.status(200).json({ success: true, data: logs });
  } catch (err) {
    return next(err);
  }
});

app.get('/api/admin/seo-listings', sprint5Controller.getSeoListings);
app.post('/api/admin/seo-listings/sync', sprint5Controller.syncSeoListing);
app.post('/api/admin/seo-listings/configure', sprint5Controller.configureSeoListing);
app.get('/api/admin/franchise-apps', sprint5Controller.getFranchiseApplications);
app.post('/api/admin/franchise-apps/action', sprint5Controller.handleFranchiseAppAction);
app.post('/api/staff/instant-payout/request', sprint5Controller.requestInstantPayout);
app.get('/api/owner/integrations', sprint5Controller.getOwnerIntegrations);
app.post('/api/admin/integrations/disconnect', sprint5Controller.disconnectChannel);

// Public SEO Metadata & Sitemap XML endpoints
const seoController = require('./modules/seo/seo.controller');
app.get('/api/public/seo', seoController.getPublicSeoHandler);
app.get('/sitemap.xml', seoController.getSitemapHandler);
app.get('/api/restaurants/:restaurantId/menu', authorize('Owner', 'Manager'), verifyRestaurantOwnership, async (req, res, next) => {
  try {
    const { getMenuItemsByRestaurantId } = require('./modules/menu/menu.service');
    const menuItems = await getMenuItemsByRestaurantId(req.params.restaurantId, req.query);
    return res.status(200).json(menuItems);
  } catch (error) {
    console.error('[menu] restaurant menu lookup failed:', error);
    console.error('[menu] restaurant menu lookup stack:', error.stack);
    return next(error);
  }
});

app.get('/api/restaurants/:restaurantId/categories', authorize('Owner', 'Manager'), async (req, res, next) => {
  try {
    const { getCategoriesByRestaurantId } = require('./modules/category/category.service');
    const categories = await getCategoriesByRestaurantId(req.params.restaurantId);
    return res.status(200).json({ categories });
  } catch (error) {
    console.error('[category] restaurant categories lookup failed:', error);
    console.error('[category] restaurant categories lookup stack:', error.stack);
    return next(error);
  }
});

app.get('/api/restaurants/:restaurantId/staff', authorize('Admin', 'Owner'), verifyRestaurantOwnership, async (req, res, next) => {
  try {
    const { getStaffByRestaurantId } = require('./modules/staff/staff.service');
    const staff = await getStaffByRestaurantId(req.params.restaurantId, req.query);
    return res.status(200).json(staff);
  } catch (error) {
    console.error('[staff] restaurant staff lookup failed:', error);
    console.error('[staff] restaurant staff lookup stack:', error.stack);
    return next(error);
  }
});

app.get('/api/restaurants/:restaurantId/drivers', authorize('Owner', 'Driver'), verifyRestaurantOwnership, async (req, res, next) => {
  try {
    const { getDriversByRestaurantId } = require('./modules/driver/driver.service');
    const drivers = await getDriversByRestaurantId(req.params.restaurantId, req.query);
    return res.status(200).json(drivers);
  } catch (error) {
    console.error('[driver] restaurant drivers lookup failed:', error);
    console.error('[driver] restaurant drivers lookup stack:', error.stack);
    return next(error);
  }
});

app.get('/api/restaurants/:restaurantId/inventory', authorize('Admin', 'Owner', 'Manager'), verifyRestaurantOwnership, async (req, res, next) => {
  try {
    const { getInventoryByRestaurantId } = require('./modules/inventory/inventory.service');
    const inventoryItems = await getInventoryByRestaurantId(req.params.restaurantId, req.query);
    return res.status(200).json(inventoryItems);
  } catch (error) {
    console.error('[inventory] restaurant inventory lookup failed:', error);
    console.error('[inventory] restaurant inventory lookup stack:', error.stack);
    return next(error);
  }
});

app.get('/api/restaurants/:restaurantId/loyalty', authorize('Admin', 'Owner', 'Manager'), async (req, res, next) => {
  try {
    const { getLoyaltyMembersByRestaurantId } = require('./modules/loyalty/loyalty.service');
    const loyaltyMembers = await getLoyaltyMembersByRestaurantId(req.params.restaurantId);
    return res.status(200).json({ loyaltyMembers });
  } catch (error) {
    console.error('[loyalty] restaurant loyalty lookup failed:', error);
    console.error('[loyalty] restaurant loyalty lookup stack:', error.stack);
    return next(error);
  }
});

app.get('/api/restaurants/:restaurantId/customers', authorize('Admin', 'Owner', 'Manager'), verifyRestaurantOwnership, async (req, res, next) => {
  try {
    const { getCustomersByRestaurantId } = require('./modules/customer/customer.service');
    const customers = await getCustomersByRestaurantId(req.params.restaurantId, req.query);
    return res.status(200).json(customers);
  } catch (error) {
    console.error('[customer] restaurant customers lookup failed:', error);
    console.error('[customer] restaurant customers lookup stack:', error.stack);
    return next(error);
  }
});

app.get('/api/restaurants/:restaurantId/notifications', authorize('Admin', 'Owner', 'Manager'), verifyRestaurantOwnership, async (req, res, next) => {
  try {
    const { getNotificationsByRestaurantId } = require('./modules/notification/notification.service');
    const notifications = await getNotificationsByRestaurantId(req.params.restaurantId, req.query);
    return res.status(200).json(notifications);
  } catch (error) {
    console.error('[notification] restaurant notifications lookup failed:', error);
    console.error('[notification] restaurant notifications lookup stack:', error.stack);
    return next(error);
  }
});

app.get('/health', (request, response) => {
  response.status(200).json({
    status: 'OK',
    message: 'RestruRent Backend Running'
  });
});

app.get('/health/database', async (req, res, next) => {
  try {
    const connected = await checkDatabaseConnection();
    res.status(200).json({ connected });
  } catch (error) {
    console.error(error);
    error.statusCode = 503;
    error.message = process.env.NODE_ENV === 'production' ? 'Database connection unavailable.' : error.message;
    return next(error);
  }
});

app.use(errorHandler);

module.exports = app;
