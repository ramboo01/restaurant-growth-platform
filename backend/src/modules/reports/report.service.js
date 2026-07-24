const { getDatabasePool } = require('../../config/database');

async function getSalesReport(restaurantId) {
  const [[row]] = await getDatabasePool().execute(`
    SELECT
      COUNT(*) AS totalOrders,
      SUM(CASE WHEN order_status = 'Completed' OR order_status = 'Delivered' THEN 1 ELSE 0 END) AS completedOrders,
      SUM(CASE WHEN order_status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelledOrders,
      COALESCE(SUM(CASE WHEN order_status IN ('Completed', 'Delivered') THEN total_amount ELSE 0 END), 0) AS totalRevenue,
      COALESCE(AVG(CASE WHEN order_status IN ('Completed', 'Delivered') THEN total_amount ELSE NULL END), 0) AS averageOrderValue
    FROM orders
    WHERE restaurant_id = ?
  `, [restaurantId]);

  return {
    totalOrders: Number(row.totalOrders) || 0,
    completedOrders: Number(row.completedOrders) || 0,
    cancelledOrders: Number(row.cancelledOrders) || 0,
    totalRevenue: Number(row.totalRevenue) || 0,
    averageOrderValue: Number(row.averageOrderValue) || 0
  };
}

async function getMenuReport(restaurantId) {
  const [[row]] = await getDatabasePool().execute(`
    SELECT
      COUNT(*) AS totalMenuItems,
      SUM(CASE WHEN is_available = 1 THEN 1 ELSE 0 END) AS availableItems,
      SUM(CASE WHEN is_available = 0 THEN 1 ELSE 0 END) AS unavailableItems
    FROM menu_items
    WHERE restaurant_id = ?
  `, [restaurantId]);

  return {
    totalMenuItems: Number(row.totalMenuItems) || 0,
    availableItems: Number(row.availableItems) || 0,
    unavailableItems: Number(row.unavailableItems) || 0
  };
}

async function getStaffReport(restaurantId) {
  const [[row]] = await getDatabasePool().execute(`
    SELECT
      COUNT(*) AS totalStaff,
      SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) AS activeStaff,
      SUM(CASE WHEN status <> 'Active' THEN 1 ELSE 0 END) AS inactiveStaff
    FROM staff
    WHERE restaurant_id = ?
  `, [restaurantId]);

  return {
    totalStaff: Number(row.totalStaff) || 0,
    activeStaff: Number(row.activeStaff) || 0,
    inactiveStaff: Number(row.inactiveStaff) || 0
  };
}

async function getReportsSummary(restaurantId, period) {
  const pool = getDatabasePool();

  const [[row]] = await pool.execute(`
    SELECT
      COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN total_amount ELSE 0 END), 0) AS todaySales,
      COALESCE(SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN total_amount ELSE 0 END), 0) AS weeklySales,
      COALESCE(SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN total_amount ELSE 0 END), 0) AS monthlySales,
      COUNT(*) AS totalOrders
    FROM orders
    WHERE restaurant_id = ? AND order_status IN ('Completed', 'Delivered')
  `, [restaurantId]);

  return {
    todaysSales: `$${Number(row.todaySales).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    todaySales: `$${Number(row.todaySales).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    weeklySales: `$${Number(row.weeklySales).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    monthlySales: `$${Number(row.monthlySales).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    totalOrders: Number(row.totalOrders) || 0
  };
}

async function getRevenueTrend(restaurantId, period) {
  const pool = getDatabasePool();
  
  if (period === 'day') {
    // Group by hour for today
    const [rows] = await pool.execute(`
      SELECT HOUR(created_at) AS hr, SUM(total_amount) AS total
      FROM orders
      WHERE restaurant_id = ? AND order_status IN ('Completed', 'Delivered') AND DATE(created_at) = CURDATE()
      GROUP BY HOUR(created_at)
    `, [restaurantId]);

    const trend = Array(24).fill(0);
    for (const r of rows) {
      trend[r.hr] = Number(r.total) || 0;
    }
    return trend;
  } else if (period === 'month') {
    // Group by day of the last 30 days
    const [rows] = await pool.execute(`
      SELECT DATE(created_at) AS dt, SUM(total_amount) AS total
      FROM orders
      WHERE restaurant_id = ? AND order_status IN ('Completed', 'Delivered') AND created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
      GROUP BY DATE(created_at)
    `, [restaurantId]);

    const trend = [];
    const dateMap = {};
    for (const r of rows) {
      // Format as YYYY-MM-DD
      const dStr = new Date(r.dt).toISOString().split('T')[0];
      dateMap[dStr] = Number(r.total) || 0;
    }

    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      trend.push(dateMap[dStr] || 0);
    }
    return trend;
  } else {
    // Group by day of the last 7 days (default 'week')
    const [rows] = await pool.execute(`
      SELECT DATE(created_at) AS dt, SUM(total_amount) AS total
      FROM orders
      WHERE restaurant_id = ? AND order_status IN ('Completed', 'Delivered') AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(created_at)
    `, [restaurantId]);

    const trend = [];
    const dateMap = {};
    for (const r of rows) {
      const dStr = new Date(r.dt).toISOString().split('T')[0];
      dateMap[dStr] = Number(r.total) || 0;
    }

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      trend.push(dateMap[dStr] || 0);
    }
    return trend;
  }
}

async function getOrdersTrend(restaurantId, period) {
  const pool = getDatabasePool();
  
  if (period === 'day') {
    // Group by hour for today
    const [rows] = await pool.execute(`
      SELECT HOUR(created_at) AS hr, COUNT(*) AS count
      FROM orders
      WHERE restaurant_id = ? AND order_status IN ('Completed', 'Delivered') AND DATE(created_at) = CURDATE()
      GROUP BY HOUR(created_at)
    `, [restaurantId]);

    const trend = Array(24).fill(0);
    for (const r of rows) {
      trend[r.hr] = Number(r.count) || 0;
    }
    return trend;
  } else if (period === 'month') {
    // Group by day of the last 30 days
    const [rows] = await pool.execute(`
      SELECT DATE(created_at) AS dt, COUNT(*) AS count
      FROM orders
      WHERE restaurant_id = ? AND order_status IN ('Completed', 'Delivered') AND created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
      GROUP BY DATE(created_at)
    `, [restaurantId]);

    const trend = [];
    const dateMap = {};
    for (const r of rows) {
      const dStr = new Date(r.dt).toISOString().split('T')[0];
      dateMap[dStr] = Number(r.count) || 0;
    }

    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      trend.push(dateMap[dStr] || 0);
    }
    return trend;
  } else {
    // Group by day of the last 7 days (default 'week')
    const [rows] = await pool.execute(`
      SELECT DATE(created_at) AS dt, COUNT(*) AS count
      FROM orders
      WHERE restaurant_id = ? AND order_status IN ('Completed', 'Delivered') AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(created_at)
    `, [restaurantId]);

    const trend = [];
    const dateMap = {};
    for (const r of rows) {
      const dStr = new Date(r.dt).toISOString().split('T')[0];
      dateMap[dStr] = Number(r.count) || 0;
    }

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      trend.push(dateMap[dStr] || 0);
    }
    return trend;
  }
}

async function getTopItems(restaurantId, period) {
  const pool = getDatabasePool();
  let interval = 'INTERVAL 7 DAY';
  if (period === 'day') interval = 'INTERVAL 1 DAY';
  if (period === 'month') interval = 'INTERVAL 30 DAY';

  const [rows] = await pool.execute(`
    SELECT items
    FROM orders
    WHERE restaurant_id = ? AND order_status IN ('Completed', 'Delivered') AND created_at >= DATE_SUB(NOW(), ${interval})
  `, [restaurantId]);

  const itemsMap = {};
  for (const r of rows) {
    let items = r.items;
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch (e) {
        items = [];
      }
    }
    if (Array.isArray(items)) {
      for (const item of items) {
        const name = item.itemName || 'Unknown Item';
        const qty = Number(item.quantity) || 1;
        const total = Number(item.total) || (qty * (Number(item.unitPrice) || 0));

        if (!itemsMap[name]) {
          itemsMap[name] = { name, orders: 0, revenue: 0 };
        }
        itemsMap[name].orders += qty;
        itemsMap[name].revenue += total;
      }
    }
  }

  const list = Object.values(itemsMap);
  list.sort((a, b) => b.orders - a.orders);

  const top5 = list.slice(0, 5).map(item => ({
    name: item.name,
    orders: item.orders,
    value: `${item.orders} orders`,
    revenue: `$${item.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }));

  // Fallback if no items sold yet
  if (top5.length === 0) {
    return [
      { name: 'No items sold', orders: 0, value: '0 orders', revenue: '$0.00' }
    ];
  }

  return top5;
}

async function getRevenueRecovery(restaurantId, period) {
  const pool = getDatabasePool();
  let interval = 'INTERVAL 7 DAY';
  if (period === 'day') interval = 'INTERVAL 1 DAY';
  if (period === 'month') interval = 'INTERVAL 30 DAY';

  const [[row]] = await pool.execute(`
    SELECT
      COALESCE(SUM(total_amount), 0) AS totalRevenue,
      COUNT(*) AS totalOrders
    FROM orders
    WHERE restaurant_id = ? AND order_status IN ('Completed', 'Delivered') AND created_at >= DATE_SUB(NOW(), ${interval})
  `, [restaurantId]);

  const totalRevenue = Number(row.totalRevenue) || 0;
  const totalOrders = Number(row.totalOrders) || 0;

  // Let's assume a baseline 30% commission from third-party marketplaces
  const commissionAvoided = totalRevenue * 0.30;
  // Let's assume a 2.5% platform fee for our platform
  const platformFee = totalRevenue * 0.025;
  const netSavings = commissionAvoided - platformFee;

  // Generate plain-English AI narrative summary
  let aiSummary = '';
  if (totalOrders > 0) {
    aiSummary = `By routing ${totalOrders} orders directly through your own brand channels instead of third-party apps, you saved an estimated $${commissionAvoided.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} in delivery commissions (based on a 30% marketplace average). After accounting for your 2.5% platform fee, your net recovered profit is $${netSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}!`;
  } else {
    aiSummary = 'No completed direct orders have been processed during this period. Direct-channel promotions and guest loyalty campaigns can help drive direct orders and recover commission revenue.';
  }

  return {
    totalRevenue,
    totalOrders,
    commissionAvoided,
    platformFee,
    netSavings,
    aiSummary
  };
}

module.exports = {
  getSalesReport,
  getMenuReport,
  getStaffReport,
  getReportsSummary,
  getRevenueTrend,
  getOrdersTrend,
  getTopItems,
  getRevenueRecovery
};
