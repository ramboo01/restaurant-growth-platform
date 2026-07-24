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
const uploadRoutes = require('./modules/upload/upload.routes');
const publicRoutes = require('./modules/public/public.routes');

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

    if (allowedOrigins.includes(origin)) {
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
app.use('/api/inventory', authorize('Admin', 'Owner', 'Manager'), verifyRestaurantOwnership, inventoryRoutes);
app.use('/api/loyalty', authorize('Admin', 'Owner', 'Manager'), loyaltyRoutes);
app.use('/api/analytics', authorize('Admin', 'Owner'), verifyRestaurantOwnership, analyticsRoutes);
app.use('/api/customers', authorize('Admin', 'Owner', 'Manager'), verifyRestaurantOwnership, customerRoutes);
app.use('/api/notifications', authorize('Admin', 'Owner', 'Manager'), verifyRestaurantOwnership, notificationRoutes);
app.use('/api/reports', authorize('Admin', 'Owner'), verifyRestaurantOwnership, reportRoutes);
app.use('/api/suppliers', authorize('Admin', 'Owner', 'Manager'), verifyRestaurantOwnership, supplierRoutes);
app.use('/api/upload', uploadRoutes);
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
