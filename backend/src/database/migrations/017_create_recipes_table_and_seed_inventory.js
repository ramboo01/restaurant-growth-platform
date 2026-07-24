module.exports = {
  name: '017_create_recipes_table_and_seed_inventory',
  up: async (pool) => {
    // 1. Ensure at least 1 restaurant exists
    const [restaurants] = await pool.execute('SELECT id FROM restaurants LIMIT 1');
    const restaurantId = restaurants[0]?.id || 1;

    // 2. Seed default inventory items
    const inventoryItems = [
      { name: 'Beef Patty', category: 'Meat', unit: 'pcs', qty: 150, minQty: 20, supplier: 'MeatCo' },
      { name: 'Brioche Bun', category: 'Bread', unit: 'pcs', qty: 200, minQty: 30, supplier: 'BakeHouse' },
      { name: 'Mozzarella Cheese', category: 'Dairy', unit: 'kg', qty: 25, minQty: 5, supplier: 'DairyLand' },
      { name: 'Pizza Dough', category: 'Bread', unit: 'pcs', qty: 100, minQty: 15, supplier: 'BakeHouse' },
      { name: 'Coffee Beans', category: 'Beverage', unit: 'kg', qty: 10, minQty: 2, supplier: 'BeanDistributors' }
    ];

    for (const item of inventoryItems) {
      const [existing] = await pool.execute(
        'SELECT id FROM inventory WHERE restaurant_id = ? AND item_name = ? LIMIT 1',
        [restaurantId, item.name]
      );
      if (existing.length === 0) {
        await pool.execute(
          `INSERT INTO inventory (restaurant_id, item_name, category, unit, quantity, minimum_quantity, supplier, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [restaurantId, item.name, item.category, item.unit, item.qty, item.minQty, item.supplier, 'In Stock']
        );
      }
    }

    // 3. Create recipes table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS recipes (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        menu_item_id INT NOT NULL,
        inventory_id INT NOT NULL,
        quantity_required DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
        FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE
      )
    `);

    // 4. Seed recipes mapping
    // Get menu items to map
    const [menuItems] = await pool.execute('SELECT id, name FROM menu_items WHERE restaurant_id = ?', [restaurantId]);
    const burger = menuItems.find(m => m.name.includes('Burger'));
    const pizza = menuItems.find(m => m.name.includes('Pizza'));
    const coffee = menuItems.find(m => m.name.includes('Coffee'));

    // Get inventory items to map
    const [invItems] = await pool.execute('SELECT id, item_name FROM inventory WHERE restaurant_id = ?', [restaurantId]);
    const patty = invItems.find(i => i.item_name === 'Beef Patty');
    const bun = invItems.find(i => i.item_name === 'Brioche Bun');
    const cheese = invItems.find(i => i.item_name === 'Mozzarella Cheese');
    const dough = invItems.find(i => i.item_name === 'Pizza Dough');
    const beans = invItems.find(i => i.item_name === 'Coffee Beans');

    // Helper to insert recipe if not exists
    const addRecipe = async (menuItemId, inventoryId, qtyRequired) => {
      if (!menuItemId || !inventoryId) return;
      const [existing] = await pool.execute(
        'SELECT id FROM recipes WHERE menu_item_id = ? AND inventory_id = ? LIMIT 1',
        [menuItemId, inventoryId]
      );
      if (existing.length === 0) {
        await pool.execute(
          'INSERT INTO recipes (menu_item_id, inventory_id, quantity_required) VALUES (?, ?, ?)',
          [menuItemId, inventoryId, qtyRequired]
        );
      }
    };

    if (burger) {
      if (patty) await addRecipe(burger.id, patty.id, 1.00);
      if (bun) await addRecipe(burger.id, bun.id, 1.00);
    }
    if (pizza) {
      if (dough) await addRecipe(pizza.id, dough.id, 1.00);
      if (cheese) await addRecipe(pizza.id, cheese.id, 0.20); // 200g
    }
    if (coffee && beans) {
      await addRecipe(coffee.id, beans.id, 0.03); // 30g
    }
  }
};
