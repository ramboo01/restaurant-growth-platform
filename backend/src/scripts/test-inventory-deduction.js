const { getDatabasePool } = require('../config/database');
const { createOrder, updateOrderStatus } = require('../modules/order/order.service');

async function testInventoryDeduction() {
  console.log('--- STARTING INVENTORY DEDUCTION TEST ---');
  const pool = getDatabasePool();

  try {
    const restaurantId = 1;
    const phone = '9988776655';

    // 1. Reset inventory items to base amounts
    console.log('Resetting test inventory quantities...');
    await pool.execute(
      "UPDATE inventory SET quantity = 150.00, status = 'In Stock' WHERE restaurant_id = ? AND item_name = 'Beef Patty'",
      [restaurantId]
    );
    await pool.execute(
      "UPDATE inventory SET quantity = 200.00, status = 'In Stock' WHERE restaurant_id = ? AND item_name = 'Brioche Bun'",
      [restaurantId]
    );

    // Get the IDs of the menu items
    const [menuItems] = await pool.execute('SELECT id, name FROM menu_items WHERE restaurant_id = ?', [restaurantId]);
    const burger = menuItems.find(m => m.name.includes('Burger'));

    if (!burger) {
      console.log('❌ FAIL: Menu item "Artisanal Truffle Burger" not found. Seed the database first.');
      return;
    }

    console.log(`Found burger menu item ID: ${burger.id}`);

    // Verify recipe exists
    const [recipes] = await pool.execute(
      'SELECT r.id, i.item_name, r.quantity_required FROM recipes r JOIN inventory i ON r.inventory_id = i.id WHERE r.menu_item_id = ?',
      [burger.id]
    );
    console.log('Associated recipe ingredients:', JSON.stringify(recipes, null, 2));

    if (recipes.length === 0) {
      console.log('❌ FAIL: No recipe mappings found for burger. Check migration 017.');
      return;
    }

    // 2. Place an order for 3 burgers
    const orderNumber = `ORD-INV-${Math.floor(1000 + Math.random() * 9000)}`;
    console.log(`\n[Step 1] Placing order ${orderNumber} for 3 burgers...`);
    const order = await createOrder({
      restaurantId,
      customerName: 'Inventory Tester',
      customerPhone: phone,
      orderNumber,
      totalAmount: 47.97,
      orderStatus: 'Pending',
      paymentStatus: 'Pending',
      items: [
        { itemId: burger.id, itemName: burger.name, quantity: 3, unitPrice: 15.99, total: 47.97 }
      ],
      fulfillmentDetails: { type: 'Pickup' }
    });

    // 3. Mark the order as Delivered to trigger inventory deduction
    console.log('[Step 2] Completing order (Pending -> Delivered)...');
    await updateOrderStatus(order.id, 'Delivered');

    // 4. Fetch the inventory quantities to check deduction
    console.log('\n[Step 3] Checking updated inventory levels...');
    const [pattyRows] = await pool.execute("SELECT quantity, status FROM inventory WHERE restaurant_id = ? AND item_name = 'Beef Patty'", [restaurantId]);
    const [bunRows] = await pool.execute("SELECT quantity, status FROM inventory WHERE restaurant_id = ? AND item_name = 'Brioche Bun'", [restaurantId]);

    const pattyQty = Number(pattyRows[0].quantity);
    const bunQty = Number(bunRows[0].quantity);

    console.log(`Beef Patty quantity: ${pattyQty} (expected 147) - Status: ${pattyRows[0].status}`);
    console.log(`Brioche Bun quantity: ${bunQty} (expected 197) - Status: ${bunRows[0].status}`);

    if (pattyQty === 147 && bunQty === 197) {
      console.log('✅ PASS: Inventory stock correctly auto-deducted (3 burgers * 1 qty each).');
    } else {
      console.log('❌ FAIL: Inventory deduction math is incorrect.');
    }

  } catch (error) {
    console.error('Inventory test encountered error:', error);
  } finally {
    await pool.end();
    console.log('\n--- INVENTORY DEDUCTION TEST COMPLETED ---');
  }
}

testInventoryDeduction().catch(console.error);
