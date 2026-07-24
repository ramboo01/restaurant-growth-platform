const { getDatabasePool } = require('../config/database');
const { getReportsSummary, getRevenueTrend, getOrdersTrend, getTopItems } = require('../modules/reports/report.service');
const { createOrder, updateOrderStatus } = require('../modules/order/order.service');

async function testAnalytics() {
  console.log('--- STARTING REAL ANALYTICS ENGINE TEST ---');
  const pool = getDatabasePool();

  try {
    const restaurantId = 1;
    const phone = '9988776655';

    // 1. Let's create an order for a menu item and set its status to Delivered
    const [menuItems] = await pool.execute('SELECT id, name FROM menu_items WHERE restaurant_id = ? LIMIT 2', [restaurantId]);
    if (menuItems.length === 0) {
      console.log('❌ FAIL: No menu items found. Please seed menu items first.');
      return;
    }
    
    const item1 = menuItems[0];
    const item2 = menuItems[1] || item1;

    console.log(`Using menu items: "${item1.name}" (ID ${item1.id}) and "${item2.name}" (ID ${item2.id})`);

    const orderNumber = `ORD-ANA-${Math.floor(1000 + Math.random() * 9000)}`;
    console.log(`\n[Step 1] Creating test order ${orderNumber} for analytics verification...`);
    
    const order = await createOrder({
      restaurantId,
      customerName: 'Analytics Tester',
      customerPhone: phone,
      orderNumber,
      totalAmount: 125.50,
      orderStatus: 'Pending',
      paymentStatus: 'Pending',
      items: [
        { itemId: item1.id, itemName: item1.name, quantity: 2, unitPrice: 50.00, total: 100.00 },
        { itemId: item2.id, itemName: item2.name, quantity: 1, unitPrice: 25.50, total: 25.50 }
      ],
      fulfillmentDetails: { type: 'Pickup' }
    });

    console.log('[Step 2] Completing order to ensure it registers in sales...');
    await updateOrderStatus(order.id, 'Delivered');

    // 2. Fetch reports
    console.log('\n[Step 3] Fetching Reports Summary (period: week)...');
    const summary = await getReportsSummary(restaurantId, 'week');
    console.log('Summary:', JSON.stringify(summary, null, 2));

    console.log('\n[Step 4] Fetching Revenue Trend (period: week)...');
    const revenueTrend = await getRevenueTrend(restaurantId, 'week');
    console.log('Revenue Trend:', JSON.stringify(revenueTrend, null, 2));

    console.log('\n[Step 5] Fetching Orders Trend (period: week)...');
    const ordersTrend = await getOrdersTrend(restaurantId, 'week');
    console.log('Orders Trend:', JSON.stringify(ordersTrend, null, 2));

    console.log('\n[Step 6] Fetching Top Items (period: week)...');
    const topItems = await getTopItems(restaurantId, 'week');
    console.log('Top Items:', JSON.stringify(topItems, null, 2));

    // Assertions
    if (summary.totalOrders > 0 && revenueTrend.some(v => v > 0) && topItems.some(item => item.name === item1.name)) {
      console.log('\n✅ PASS: Real analytics calculations are correct and successfully pulled from database records!');
    } else {
      console.log('\n❌ FAIL: Analytics checks failed.');
    }

  } catch (error) {
    console.error('Analytics test encountered error:', error);
  } finally {
    await pool.end();
    console.log('\n--- REAL ANALYTICS ENGINE TEST COMPLETED ---');
  }
}

testAnalytics().catch(console.error);
