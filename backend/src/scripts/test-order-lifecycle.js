const { getDatabasePool } = require('../config/database');
const { createOrder, updateOrderStatus } = require('../modules/order/order.service');
const { getCustomers } = require('../modules/customer/customer.service');

async function testLifecycle() {
  console.log('--- STARTING END-TO-END WORKFLOW TEST ---');
  
  // 1. Initialize Database Connection
  console.log('Connecting to database...');
  const pool = getDatabasePool();

  try {
    const phone = '9988776655';
    const restaurantId = 1;

    // 2. Clear pre-existing data for this phone number to ensure clean test
    console.log(`Cleaning old test data for phone: ${phone}...`);
    await pool.execute('DELETE FROM loyalty_members WHERE phone = ?', [phone]);
    await pool.execute('DELETE FROM customers WHERE phone = ?', [phone]);
    await pool.execute('DELETE FROM orders WHERE customer_phone = ?', [phone]);

    // 3. Place Order 1: $100.00
    const orderNumber1 = `ORD-TEST-${Math.floor(1000 + Math.random() * 9000)}`;
    console.log(`\n[Step 1] Creating guest order ${orderNumber1} for $100.00...`);
    const order1 = await createOrder({
      restaurantId,
      customerName: 'Test Customer',
      customerPhone: phone,
      orderNumber: orderNumber1,
      totalAmount: 100.00,
      orderStatus: 'Pending',
      paymentStatus: 'Pending',
      items: [
        { itemId: 1, itemName: 'Artisanal Truffle Burger', quantity: 2, unitPrice: 15.99, total: 31.98 }
      ],
      fulfillmentDetails: { type: 'Delivery', addressLine: '123 Test St' }
    });
    console.log(`Order 1 created successfully with ID: ${order1.id}`);

    // 4. Update status through the workflow to Delivered
    console.log('[Step 2] Owner accepts order (Pending -> Accepted)...');
    await updateOrderStatus(order1.id, 'Accepted');

    console.log('[Step 3] Staff starts preparation (Accepted -> Preparing)...');
    await updateOrderStatus(order1.id, 'Preparing');

    console.log('[Step 4] Staff marks order ready (Preparing -> Ready)...');
    await updateOrderStatus(order1.id, 'Ready');

    console.log('[Step 5] Driver delivers order (Ready -> Delivered)...');
    const finalOrder1 = await updateOrderStatus(order1.id, 'Delivered');
    console.log(`Order 1 workflow complete. Current Status: ${finalOrder1.orderStatus}`);

    // 5. Verify Loyalty points and CRM auto-enrollment/Segment
    console.log('\n[Step 6] Verifying Loyalty & CRM after Order 1 completion...');
    
    // Fetch directly from DB
    const [loyaltyRows] = await pool.execute('SELECT points, tier FROM loyalty_members WHERE phone = ?', [phone]);
    const loyaltyMember = loyaltyRows[0];
    console.log('Loyalty member profile:', JSON.stringify(loyaltyMember, null, 2));

    const crmResult = await getCustomers({ phone });
    const customer = crmResult.items[0];
    console.log('CRM customer profile:', JSON.stringify(customer, null, 2));

    if (loyaltyMember && Number(loyaltyMember.points) === 1000) {
      console.log('✅ PASS: Earned 1000 loyalty points (100 * 10).');
    } else {
      console.log('❌ FAIL: Incorrect loyalty points value.');
    }

    if (customer && customer.segment === 'New') {
      console.log('✅ PASS: Customer auto-created in CRM and classified as "New" segment.');
    } else {
      console.log('❌ FAIL: Customer segmentation check failed.');
    }

    // 6. Place Order 2: $200.00 to trigger VIP status
    const orderNumber2 = `ORD-TEST-${Math.floor(1000 + Math.random() * 9000)}`;
    console.log(`\n[Step 7] Creating second guest order ${orderNumber2} for $200.00...`);
    const order2 = await createOrder({
      restaurantId,
      customerName: 'Test Customer',
      customerPhone: phone,
      orderNumber: orderNumber2,
      totalAmount: 200.00,
      orderStatus: 'Pending',
      paymentStatus: 'Pending',
      items: [
        { itemId: 2, itemName: 'Crispy Garlic Parmesan Wings', quantity: 3, unitPrice: 11.49, total: 34.47 }
      ],
      fulfillmentDetails: { type: 'Delivery', addressLine: '123 Test St' }
    });

    console.log('[Step 8] Completing second order directly (Pending -> Delivered)...');
    await updateOrderStatus(order2.id, 'Delivered');

    // 7. Verify Loyalty points and CRM tier upgrades/Segment transitions
    console.log('\n[Step 9] Verifying Loyalty & CRM after Order 2 completion...');
    const [loyaltyRows2] = await pool.execute('SELECT points, tier FROM loyalty_members WHERE phone = ?', [phone]);
    const loyaltyMember2 = loyaltyRows2[0];
    console.log('Loyalty member profile:', JSON.stringify(loyaltyMember2, null, 2));

    const crmResult2 = await getCustomers({ phone });
    const customer2 = crmResult2.items[0];
    console.log('CRM customer profile:', JSON.stringify(customer2, null, 2));

    // Total Spent = 100 + 200 = 300 (should trigger VIP segment since spend >= 250)
    // Points = 1000 + 2000 = 3000 (should trigger Platinum tier since points >= 2000)
    if (loyaltyMember2 && loyaltyMember2.tier === 'Platinum' && Number(loyaltyMember2.points) === 3000) {
      console.log('✅ PASS: Loyalty upgraded to Platinum Tier with 3000 points.');
    } else {
      console.log('❌ FAIL: Loyalty tier/points upgrade check failed.');
    }

    if (customer2 && customer2.segment === 'VIP' && Number(customer2.totalOrders) === 2 && Number(customer2.totalSpend) === 300) {
      console.log('✅ PASS: Customer successfully transitioned to "VIP" segment with $300 spent across 2 orders.');
    } else {
      console.log('❌ FAIL: CRM VIP transition check failed.');
    }

  } catch (error) {
    console.error('Lifecycle test encountered error:', error);
  } finally {
    // End pool to allow script to exit clean
    await pool.end();
    console.log('\n--- LIFECYCLE TEST COMPLETED ---');
  }
}

testLifecycle().catch(console.error);
