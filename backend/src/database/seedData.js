const { getDatabasePool } = require('../config/database');

async function seed() {
  const pool = getDatabasePool();
  console.log('[Seed] Starting database seed...');

  try {
    // 1. Ensure at least 1 restaurant exists
    const [restaurants] = await pool.execute('SELECT id FROM restaurants LIMIT 1');
    let restaurantId = restaurants[0]?.id;

    if (!restaurantId) {
      const [result] = await pool.execute(
        `INSERT INTO restaurants (name, phone, email, address, cuisine, opening_time, closing_time)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['Urban Bistro & Grill', '555-0199', 'contact@urbanbistro.com', '742 Evergreen Terrace, Springfield', 'American Fusion', '09:00:00', '23:00:00']
      );
      restaurantId = result.insertId;
      console.log(`[Seed] Created default restaurant ID: ${restaurantId}`);
    } else {
      console.log(`[Seed] Using existing restaurant ID: ${restaurantId}`);
    }

    // 2. Ensure categories exist for this restaurant
    const categories = ['Appetizers', 'Burgers & Mains', 'Pizza & Pasta', 'Drinks & Desserts'];
    for (let i = 0; i < categories.length; i++) {
      const catName = categories[i];
      const [existing] = await pool.execute(
        'SELECT id FROM menu_categories WHERE restaurant_id = ? AND name = ? LIMIT 1',
        [restaurantId, catName]
      );
      if (existing.length === 0) {
        await pool.execute(
          'INSERT INTO menu_categories (restaurant_id, name, display_order) VALUES (?, ?, ?)',
          [restaurantId, catName, i + 1]
        );
        console.log(`[Seed] Added category: ${catName}`);
      }
    }

    // 3. Ensure menu items exist
    const items = [
      {
        name: 'Artisanal Truffle Burger',
        description: 'Prime Angus beef patty, black truffle aioli, aged cheddar, arugula on brioche.',
        category: 'Burgers & Mains',
        price: 15.99,
        isAvailable: 1
      },
      {
        name: 'Crispy Garlic Parmesan Wings',
        description: 'Jumbo wings tossed in roasted garlic butter, aged parmesan, fresh parsley.',
        category: 'Appetizers',
        price: 11.49,
        isAvailable: 1
      },
      {
        name: 'Wood-Fired Margherita Pizza',
        description: 'San Marzano tomatoes, fresh mozzarella di bufala, basil, extra virgin olive oil.',
        category: 'Pizza & Pasta',
        price: 13.99,
        isAvailable: 1
      },
      {
        name: 'Truffle Mac & Cheese',
        description: 'Cavatappi pasta, 4-cheese fondue, crispy panko topping, white truffle drizzle.',
        category: 'Burgers & Mains',
        price: 12.99,
        isAvailable: 1
      },
      {
        name: 'Cold Brew Craft Coffee',
        description: 'Single-origin 18-hour cold brew, rich cacao notes, served over ice.',
        category: 'Drinks & Desserts',
        price: 4.99,
        isAvailable: 1
      },
      {
        name: 'Valrhona Chocolate Lava Cake',
        description: 'Warm molten dark chocolate center, Madagascar vanilla bean gelato.',
        category: 'Drinks & Desserts',
        price: 7.99,
        isAvailable: 1
      }
    ];

    for (const item of items) {
      const [existing] = await pool.execute(
        'SELECT id FROM menu_items WHERE restaurant_id = ? AND name = ? LIMIT 1',
        [restaurantId, item.name]
      );
      if (existing.length === 0) {
        await pool.execute(
          `INSERT INTO menu_items (restaurant_id, name, description, category, price, is_available)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [restaurantId, item.name, item.description, item.category, item.price, item.isAvailable]
        );
        console.log(`[Seed] Added menu item: ${item.name}`);
      }
    }

    console.log('[Seed] Database seed finished successfully!');
  } catch (err) {
    console.error('[Seed] Error seeding database:', err);
  } finally {
    await pool.end();
  }
}

seed();
