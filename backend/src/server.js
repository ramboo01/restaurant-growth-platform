const http = require('http');
const app = require('./app');
const { PORT } = require('./config/env');
const socketUtils = require('./utils/socket');
const { startReconciliationWorker } = require('./workers/reconciliationWorker');

const server = http.createServer(app);

// Initialize Socket.io
socketUtils.init(server);

server.listen(PORT, async () => {
  console.log(`RestruRent backend listening on port ${PORT}`);
  
  // Automatically run database migrations and seeds if tables are empty or missing
  try {
    const { getDatabasePool } = require('./config/database');
    const pool = getDatabasePool();
    
    console.log('[Startup] Starting database self-healing checks...');
    
    // Run migrations
    const fs = require('fs');
    const path = require('path');
    const migrationsDir = path.resolve(__dirname, 'database', 'migrations');
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.js'))
      .sort();

    for (const file of migrationFiles) {
      try {
        const migration = require(path.join(migrationsDir, file));
        if (typeof migration.up === 'function') {
          await migration.up(pool);
        }
      } catch (migrationError) {
        // Suppress errors about already existing tables/columns
        if (!migrationError.message.includes('already exists') && !migrationError.message.includes('Duplicate')) {
          console.warn(`[Startup] Migration ${file} info:`, migrationError.message);
        }
      }
    }
    console.log('[Startup] Database migrations checked and up-to-date.');

    // Ensure default restaurant exists
    const [restaurants] = await pool.execute('SELECT id FROM restaurants LIMIT 1');
    let restaurantId = restaurants[0]?.id;
    if (!restaurantId) {
      console.log('[Startup] Seeding default restaurant...');
      const [result] = await pool.execute(
        `INSERT INTO restaurants (name, phone, email, address, cuisine, opening_time, closing_time)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['Urban Bistro & Grill', '555-0199', 'contact@urbanbistro.com', '742 Evergreen Terrace, Springfield', 'American Fusion', '09:00:00', '23:00:00']
      );
      restaurantId = result.insertId;
      
      const categories = ['Appetizers', 'Burgers & Mains', 'Pizza & Pasta', 'Drinks & Desserts'];
      for (let i = 0; i < categories.length; i++) {
        await pool.execute(
          'INSERT INTO menu_categories (restaurant_id, name, display_order) VALUES (?, ?, ?)',
          [restaurantId, categories[i], i + 1]
        );
      }
      
      const items = [
        { name: 'Artisanal Truffle Burger', description: 'Prime Angus beef patty, black truffle aioli, aged cheddar, arugula on brioche.', category: 'Burgers & Mains', price: 15.99, isAvailable: 1 },
        { name: 'Crispy Garlic Parmesan Wings', description: 'Jumbo wings tossed in roasted garlic butter, aged parmesan, fresh parsley.', category: 'Appetizers', price: 11.49, isAvailable: 1 },
        { name: 'Wood-Fired Margherita Pizza', description: 'San Marzano tomatoes, fresh mozzarella di bufala, basil, extra virgin olive oil.', category: 'Pizza & Pasta', price: 13.99, isAvailable: 1 },
        { name: 'Truffle Mac & Cheese', description: 'Cavatappi pasta, 4-cheese fondue, crispy panko topping, white truffle drizzle.', category: 'Burgers & Mains', price: 12.99, isAvailable: 1 },
        { name: 'Cold Brew Craft Coffee', description: 'Single-origin 18-hour cold brew, rich cacao notes, served over ice.', category: 'Drinks & Desserts', price: 4.99, isAvailable: 1 },
        { name: 'Valrhona Chocolate Lava Cake', description: 'Warm molten dark chocolate center, Madagascar vanilla bean gelato.', category: 'Drinks & Desserts', price: 7.99, isAvailable: 1 }
      ];

      for (const item of items) {
        await pool.execute(
          `INSERT INTO menu_items (restaurant_id, name, description, category, price, is_available)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [restaurantId, item.name, item.description, item.category, item.price, item.isAvailable]
        );
      }
      console.log('[Startup] Default restaurant, categories, and menu items seeded.');
    }

    // Ensure super admin user exists
    const [rows] = await pool.execute("SELECT id FROM users WHERE role = 'Admin' LIMIT 1");
    if (rows.length === 0) {
      console.log('[Startup] Seeding Platform Super Admin...');
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('Admin@123', 10);
      await pool.execute(
        "INSERT INTO users (name, email, password, role, is_blocked) VALUES (?, ?, ?, ?, 0)",
        ['Platform Super Admin', 'admin@platform.com', hash, 'Admin']
      );
      console.log('[Startup] Super Admin created: admin@platform.com / Admin@123');
    }
  } catch (startupErr) {
    console.error('[Startup] Self-healing database setup failed:', startupErr.message);
  }

  // Start background auto-reconciliation worker
  startReconciliationWorker(30000);
});
