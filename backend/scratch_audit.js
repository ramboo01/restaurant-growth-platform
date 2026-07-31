const http = require('http');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

const API_BASE = 'http://localhost:5000';

function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runAudit() {
  console.log('====================================================');
  console.log('🔍 STARTING END-TO-END ORDER LIFECYCLE AUDIT');
  console.log('====================================================\n');

  // 1. Direct DB Connection Audit
  console.log('--- Step 1: Checking Database Connection & User Data ---');
  let pool;
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'restrurent_db',
      waitForConnections: true,
      connectionLimit: 5
    });

    const [users] = await pool.execute('SELECT id, name, email, role, restaurant_id FROM users WHERE email = ?', ['tarun@gmail.com']);
    console.log('Owner User DB Record:', users[0] || 'NOT FOUND');

    const [restaurants] = await pool.execute('SELECT id, name FROM restaurants LIMIT 5');
    console.log('Active Restaurants in DB:', restaurants);

    const [menuCount] = await pool.execute('SELECT COUNT(*) as total FROM menu_items WHERE restaurant_id = 1');
    console.log(`Menu Items for Restaurant 1 in DB: ${menuCount[0].total}`);
  } catch (dbErr) {
    console.error('❌ DB Connection Error:', dbErr.message);
    process.exit(1);
  }

  // 2. Authentication Test
  console.log('\n--- Step 2: Testing Owner Login API (/api/auth/login) ---');
  let ownerToken = '';
  try {
    const loginRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'tarun@gmail.com', password: 'password123' });

    console.log(`Login HTTP Status: ${loginRes.status}`);
    if (loginRes.status === 200 && loginRes.body?.data?.token) {
      ownerToken = loginRes.body.data.token;
      console.log('✅ Owner Login Successful! Token retrieved.');
      console.log('User Role in Token payload:', loginRes.body.data.user?.role);
      console.log('User RestaurantId:', loginRes.body.data.user?.restaurantId);
    } else {
      console.log('⚠️ Primary password failed, trying fallback 123456...');
      const fallbackLogin = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, { email: 'tarun@gmail.com', password: '123456' });

      if (fallbackLogin.status === 200 && fallbackLogin.body?.data?.token) {
        ownerToken = fallbackLogin.body.data.token;
        console.log('✅ Owner Login Successful (with password 123456)!');
      } else {
        console.error('❌ Login Failed:', fallbackLogin.body);
      }
    }
  } catch (err) {
    console.error('❌ Login API Request Error:', err.message);
  }

  // 3. Owner Menu Fetch Test
  console.log('\n--- Step 3: Testing Owner Menu Fetch API (/api/menu) ---');
  try {
    const menuRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/menu',
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${ownerToken}`,
        'Content-Type': 'application/json' 
      }
    });

    console.log(`Owner Menu HTTP Status: ${menuRes.status}`);
    const menuData = menuRes.body?.data?.data || menuRes.body?.data || [];
    console.log(`Owner Menu Items Returned: ${Array.isArray(menuData) ? menuData.length : 'Not an array'}`);
    if (Array.isArray(menuData) && menuData.length > 0) {
      console.log('Sample Item:', { id: menuData[0].id, name: menuData[0].name, price: menuData[0].price, restaurantId: menuData[0].restaurantId });
    }
  } catch (err) {
    console.error('❌ Menu API Error:', err.message);
  }

  // 4. Guest Customer Places Order Test
  console.log('\n--- Step 4: Testing Customer Place Order API (/api/public/orders) ---');
  const testOrderNumber = `TEST-ORD-${Date.now().toString().slice(-6)}`;
  let createdOrderId = null;
  let deliveryOtp = null;

  try {
    const orderPayload = {
      restaurantId: 1,
      customerName: 'Audit Test Customer',
      customerPhone: '9876543210',
      orderNumber: testOrderNumber,
      totalAmount: 45.00,
      orderStatus: 'Pending',
      paymentStatus: 'Pending',
      items: [
        { itemId: 1, itemName: 'Butter Chicken', quantity: 2, unitPrice: 18.00, total: 36.00 },
        { itemId: 2, itemName: 'Garlic Naan', quantity: 3, unitPrice: 3.00, total: 9.00 }
      ],
      fulfillmentDetails: {
        type: 'Delivery',
        addressLine: '456 Test Avenue',
        city: 'Metropolis',
        estimatedTime: '30-40 mins'
      }
    };

    const orderRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/public/orders',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, orderPayload);

    console.log(`Place Order HTTP Status: ${orderRes.status}`);
    const orderData = orderRes.body?.data?.order || orderRes.body?.data || orderRes.body;
    console.log('Created Order Data:', {
      id: orderData.id,
      orderNumber: orderData.orderNumber,
      status: orderData.orderStatus,
      deliveryOtp: orderData.deliveryOtp
    });

    createdOrderId = orderData.id;
    deliveryOtp = orderData.deliveryOtp;

    // Verify in DB directly
    const [dbOrders] = await pool.execute('SELECT * FROM orders WHERE id = ?', [createdOrderId]);
    if (dbOrders.length > 0) {
      console.log('✅ Order verified in MySQL DB! Row exists.');
    } else {
      console.error('❌ Order NOT found in DB!');
    }
  } catch (err) {
    console.error('❌ Place Order API Error:', err.message);
  }

  if (!createdOrderId) {
    console.error('Cannot continue lifecycle test without created order ID.');
    await pool.end();
    return;
  }

  // 5. Kitchen Staff Processing Order Test
  console.log('\n--- Step 5: Testing Kitchen Staff Order Queue & Status Updates ---');
  try {
    // Kitchen sees order in list
    const kdsRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/orders?restaurantId=1',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${ownerToken}` }
    });
    console.log(`KDS List HTTP Status: ${kdsRes.status}`);

    // Update status to 'Preparing'
    const prepRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/orders/${createdOrderId}/status`,
      method: 'PATCH',
      headers: { 
        'Authorization': `Bearer ${ownerToken}`,
        'Content-Type': 'application/json'
      }
    }, { status: 'Preparing' });

    console.log(`Kitchen update to "Preparing" Status: ${prepRes.status}`);

    // Update status to 'Ready'
    const readyRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/orders/${createdOrderId}/status`,
      method: 'PATCH',
      headers: { 
        'Authorization': `Bearer ${ownerToken}`,
        'Content-Type': 'application/json'
      }
    }, { status: 'Ready' });

    console.log(`Kitchen update to "Ready" Status: ${readyRes.status}`);

    // Verify in DB
    const [dbCheckReady] = await pool.execute('SELECT order_status FROM orders WHERE id = ?', [createdOrderId]);
    console.log(`✅ DB Status after Kitchen update: "${dbCheckReady[0].order_status}"`);
  } catch (err) {
    console.error('❌ Kitchen Flow Error:', err.message);
  }

  // 6. Delivery Driver Processing Order Test
  console.log('\n--- Step 6: Testing Driver Delivery & PIN Verification ---');
  try {
    // Driver updates status to 'Out for Delivery'
    const outRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/orders/${createdOrderId}/status`,
      method: 'PATCH',
      headers: { 
        'Authorization': `Bearer ${ownerToken}`,
        'Content-Type': 'application/json'
      }
    }, { status: 'Out for Delivery' });
    console.log(`Driver update to "Out for Delivery" Status: ${outRes.status}`);

    // Driver completes delivery
    const deliveredRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/orders/${createdOrderId}/status`,
      method: 'PATCH',
      headers: { 
        'Authorization': `Bearer ${ownerToken}`,
        'Content-Type': 'application/json'
      }
    }, { status: 'Delivered', otp: deliveryOtp });
    console.log(`Driver update to "Delivered" Status: ${deliveredRes.status}`, deliveredRes.body);

    // Verify DB
    const [dbCheckDelivered] = await pool.execute('SELECT order_status FROM orders WHERE id = ?', [createdOrderId]);
    console.log(`✅ DB Status after Delivery: "${dbCheckDelivered[0].order_status}"`);
  } catch (err) {
    console.error('❌ Driver Flow Error:', err.message);
  }

  // 7. Customer Track Order Public Test
  console.log('\n--- Step 7: Testing Customer Public Order Tracking ---');
  try {
    const trackRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/public/orders/number/${testOrderNumber}`,
      method: 'GET'
    });

    console.log(`Track Order HTTP Status: ${trackRes.status}`);
    const trackData = trackRes.body?.data?.order || trackRes.body?.data || trackRes.body;
    console.log('Tracked Order Result:', {
      orderNumber: trackData.orderNumber,
      customerName: trackData.customerName,
      status: trackData.orderStatus
    });
    if (trackData.orderStatus === 'Delivered') {
      console.log('✅ Customer Tracking correctly reflects "Delivered" status!');
    }
  } catch (err) {
    console.error('❌ Track Order Error:', err.message);
  }

  // 8. Loyalty & Customer CRM Sync Check
  console.log('\n--- Step 8: Checking Automated CRM & Loyalty Points Sync ---');
  try {
    const [loyaltyRows] = await pool.execute('SELECT * FROM loyalty_members WHERE phone = ?', ['9876543210']);
    console.log('Loyalty Member DB Record after order completion:', loyaltyRows[0] || 'None');

    const [customerRows] = await pool.execute('SELECT * FROM customers WHERE phone = ?', ['9876543210']);
    console.log('Customer CRM Record after order completion:', customerRows[0] || 'None');
  } catch (err) {
    console.error('❌ Loyalty Check Error:', err.message);
  }

  console.log('\n====================================================');
  console.log('🎉 END-TO-END AUDIT COMPLETE!');
  console.log('====================================================');

  await pool.end();
}

runAudit();
