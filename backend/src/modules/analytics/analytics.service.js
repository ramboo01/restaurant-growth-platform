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
      COALESCE(SUM(total_amount), 0) AS totalRevenue
    FROM orders
    WHERE restaurant_id = ?
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

  return {
    totalRestaurants: Number(restaurants.totalRestaurants) || 0,
    totalMenuItems: Number(menuItems.totalMenuItems) || 0,
    totalCategories: Number(categories.totalCategories) || 0,
    totalOrders: Number(orders.totalOrders) || 0,
    pendingOrders: Number(orders.pendingOrders) || 0,
    acceptedOrders: Number(orders.acceptedOrders) || 0,
    preparingOrders: Number(orders.preparingOrders) || 0,
    readyOrders: Number(orders.readyOrders) || 0,
    completedOrders: Number(orders.completedOrders) || 0,
    cancelledOrders: Number(orders.cancelledOrders) || 0,
    totalRevenue: Number(orders.totalRevenue) || 0,
    totalStaff: Number(staff.totalStaff) || 0,
    totalDrivers: Number(drivers.totalDrivers) || 0,
    totalInventoryItems: Number(inventory.totalInventoryItems) || 0,
    lowStockItems: Number(inventory.lowStockItems) || 0,
    totalLoyaltyMembers: Number(loyalty.totalLoyaltyMembers) || 0
  };
}

module.exports = {
  getDashboardAnalytics
};
