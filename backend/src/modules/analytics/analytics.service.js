const { getDatabasePool } = require('../../config/database');

async function getDashboardAnalytics(restaurantId) {
  const pool = getDatabasePool();

  const [[restaurants]] = await pool.execute('SELECT COUNT(*) AS totalRestaurants FROM restaurants WHERE id = ?', [restaurantId]);
  const [[menuItems]] = await pool.execute('SELECT COUNT(*) AS totalMenuItems FROM menu_items WHERE restaurant_id = ?', [restaurantId]);
  const [[categories]] = await pool.execute('SELECT COUNT(*) AS totalCategories FROM menu_categories WHERE restaurant_id = ?', [restaurantId]);
  const [[orders]] = await pool.execute(`
    SELECT
      COUNT(*) AS totalOrders,
      SUM(CASE WHEN order_status = 'Pending' THEN 1 ELSE 0 END) AS pendingOrders,
      SUM(CASE WHEN order_status = 'Accepted' THEN 1 ELSE 0 END) AS acceptedOrders,
      SUM(CASE WHEN order_status = 'Preparing' THEN 1 ELSE 0 END) AS preparingOrders,
      SUM(CASE WHEN order_status = 'Ready' THEN 1 ELSE 0 END) AS readyOrders,
      SUM(CASE WHEN order_status = 'Completed' THEN 1 ELSE 0 END) AS completedOrders,
      SUM(CASE WHEN order_status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelledOrders,
      COALESCE(SUM(CASE WHEN order_status IN ('Completed', 'Delivered') THEN total_amount ELSE 0 END), 0) AS totalRevenue
    FROM orders
    WHERE restaurant_id = ?
  `, [restaurantId]);

  // Today's orders (for Today's Operations section)
  const [[todayOrders]] = await pool.execute(`
    SELECT
      COUNT(*) AS todayTotalOrders,
      SUM(CASE WHEN order_status = 'Pending' THEN 1 ELSE 0 END) AS todayPendingOrders,
      SUM(CASE WHEN order_status = 'Preparing' THEN 1 ELSE 0 END) AS todayPreparingOrders,
      SUM(CASE WHEN order_status = 'Ready' THEN 1 ELSE 0 END) AS todayReadyOrders,
      SUM(CASE WHEN order_status = 'Completed' THEN 1 ELSE 0 END) AS todayCompletedOrders,
      COALESCE(SUM(CASE WHEN order_status IN ('Completed', 'Delivered') THEN total_amount ELSE 0 END), 0) AS todayRevenue
    FROM orders
    WHERE restaurant_id = ? AND DATE(created_at) = CURDATE()
  `, [restaurantId]);

  const [[staff]] = await pool.execute('SELECT COUNT(*) AS totalStaff FROM staff WHERE restaurant_id = ?', [restaurantId]);
  const [[drivers]] = await pool.execute('SELECT COUNT(*) AS totalDrivers FROM drivers WHERE restaurant_id = ?', [restaurantId]);
  const [[inventory]] = await pool.execute(`
    SELECT
      COUNT(*) AS totalInventoryItems,
      SUM(CASE WHEN status = 'Low Stock' THEN 1 ELSE 0 END) AS lowStockItems
    FROM inventory
    WHERE restaurant_id = ?
  `, [restaurantId]);
  const [[loyalty]] = await pool.execute('SELECT COUNT(*) AS totalLoyaltyMembers FROM loyalty_members WHERE restaurant_id = ?', [restaurantId]);

  // Combined count of distinct customers across CRM customers, order phones/names, and registered customer users
  const [unionRows] = await pool.execute(`
    SELECT COUNT(DISTINCT identifier) AS count FROM (
      SELECT LOWER(TRIM(phone)) AS identifier FROM customers WHERE restaurant_id = ? AND phone IS NOT NULL AND phone != ''
      UNION
      SELECT LOWER(TRIM(customer_phone)) AS identifier FROM orders WHERE restaurant_id = ? AND customer_phone IS NOT NULL AND customer_phone != ''
      UNION
      SELECT LOWER(TRIM(email)) AS identifier FROM users WHERE restaurant_id = ? AND role = 'Customer' AND email IS NOT NULL AND email != ''
      UNION
      SELECT LOWER(TRIM(customer_name)) AS identifier FROM orders WHERE restaurant_id = ? AND (customer_phone IS NULL OR customer_phone = '') AND customer_name IS NOT NULL AND customer_name != ''
    ) AS unique_customers
  `, [restaurantId, restaurantId, restaurantId, restaurantId]);

  const totalCustomers = Number(unionRows[0]?.count) || 0;

  // Recent activity: last 10 orders (as activity feed)
  const [recentOrders] = await pool.execute(`
    SELECT id, order_number, customer_name, order_status, total_amount, created_at
    FROM orders
    WHERE restaurant_id = ?
    ORDER BY created_at DESC
    LIMIT 10
  `, [restaurantId]);

  const recentActivity = recentOrders.map(order => {
    const timeAgo = getTimeAgo(new Date(order.created_at));
    return {
      id: `order-${order.id}`,
      title: `Order #${order.order_number || order.id}`,
      description: `${order.customer_name || 'Customer'} — $${Number(order.total_amount || 0).toFixed(2)} — ${order.order_status}`,
      time: timeAgo,
      icon: order.order_status === 'Completed' ? 'bi-check-circle' : order.order_status === 'Cancelled' ? 'bi-x-circle' : 'bi-receipt'
    };
  });

  let cateringCount = 0;
  let cateringRevenue = 0;
  let cateringNewInquiries = 0;

  try {
    const [[catData]] = await pool.execute(`
      SELECT
        COUNT(*) AS totalCateringOrders,
        COALESCE(SUM(CASE WHEN status = 'New Inquiry' THEN 1 ELSE 0 END), 0) AS newInquiries,
        COALESCE(SUM(CASE WHEN status IN ('Confirmed', 'Completed', 'Paid') THEN paid_amount ELSE 0 END), 0) AS totalCateringRevenue
      FROM catering_orders
      WHERE restaurant_id = ?
    `, [restaurantId]);

    cateringCount = Number(catData?.totalCateringOrders) || 0;
    cateringNewInquiries = Number(catData?.newInquiries) || 0;
    cateringRevenue = Number(catData?.totalCateringRevenue) || 0;
  } catch (err) {
    console.error('[Analytics] Catering query error:', err.message);
  }

  return {
    totalRestaurants: Number(restaurants.totalRestaurants) || 0,
    totalMenuItems: Number(menuItems.totalMenuItems) || 0,
    totalCategories: Number(categories.totalCategories) || 0,
    totalOrders: Number(orders.totalOrders) + cateringCount,
    pendingOrders: Number(orders.pendingOrders) || 0,
    acceptedOrders: Number(orders.acceptedOrders) || 0,
    preparingOrders: Number(orders.preparingOrders) || 0,
    readyOrders: Number(orders.readyOrders) || 0,
    completedOrders: Number(orders.completedOrders) || 0,
    cancelledOrders: Number(orders.cancelledOrders) || 0,
    totalRevenue: Number(orders.totalRevenue) + cateringRevenue,
    cateringOrdersCount: cateringCount,
    cateringRevenue,
    cateringNewInquiries,
    totalStaff: Number(staff.totalStaff) || 0,
    totalDrivers: Number(drivers.totalDrivers) || 0,
    totalInventoryItems: Number(inventory.totalInventoryItems) || 0,
    lowStockItems: Number(inventory.lowStockItems) || 0,
    totalLoyaltyMembers: Number(loyalty.totalLoyaltyMembers) || 0,
    totalCustomers,
    todayTotalOrders: Number(todayOrders.todayTotalOrders) || 0,
    todayPendingOrders: Number(todayOrders.todayPendingOrders) || 0,
    todayPreparingOrders: Number(todayOrders.todayPreparingOrders) || 0,
    todayReadyOrders: Number(todayOrders.todayReadyOrders) || 0,
    todayCompletedOrders: Number(todayOrders.todayCompletedOrders) || 0,
    todayRevenue: Number(todayOrders.todayRevenue) || 0,
    recentActivity
  };
}

function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs} hr${diffHrs > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

module.exports = {
  getDashboardAnalytics
};
