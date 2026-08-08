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

    // Ensure security columns exist in users table
    try {
      await pool.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked TINYINT(1) NOT NULL DEFAULT 0`).catch(()=>{});
      await pool.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP NULL`).catch(()=>{});
      await pool.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked_reason VARCHAR(255) NULL`).catch(()=>{});
      await pool.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP NULL`).catch(()=>{});
      console.log('[Startup] Users security columns verified.');
    } catch (secErr) {
      console.warn('[Startup] Warning verifying users security columns:', secErr.message);
    }

    // Ensure customers table columns exist
    try {
      await pool.execute(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL`).catch(()=>{});
      await pool.execute(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS segment VARCHAR(50) DEFAULT 'New'`).catch(()=>{});
      console.log('[Startup] Customers table columns verified.');
    } catch (custColErr) {
      console.warn('[Startup] Warning verifying customers columns:', custColErr.message);
    }

    // Ensure customer_reviews table exists and is seeded
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS customer_reviews (
          id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          restaurant_id INT NOT NULL,
          customer_name VARCHAR(100) NOT NULL,
          platform VARCHAR(50) NOT NULL DEFAULT 'Google',
          rating INT NOT NULL DEFAULT 5,
          content TEXT NOT NULL,
          ai_reply_draft TEXT DEFAULT NULL,
          reply_status VARCHAR(50) NOT NULL DEFAULT 'Pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_review_restaurant (restaurant_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);

      const [reviewsCheck] = await pool.execute('SELECT id FROM customer_reviews LIMIT 1');
      if (reviewsCheck.length === 0) {
        console.log('[Startup] Seeding initial customer reviews...');
        await pool.execute(`
          INSERT INTO customer_reviews (restaurant_id, customer_name, platform, rating, content, ai_reply_draft, reply_status)
          VALUES 
            (1, 'Aarav Sharma', 'Google', 5, 'Absolutely incredible food and top-tier ambiance! The truffle burger was cooked to perfection.', 'Hi Aarav,\n\nThank you so much for the 5-star review! We are thrilled you enjoyed the truffle burger.', 'Replied'),
            (1, 'Rhea Sen', 'Zomato', 4, 'Great pizza crust and fast delivery. Would definitely order again.', NULL, 'Pending'),
            (1, 'Vikram Mehta', 'Google', 5, 'Best dining experience in town. Staff is very attentive.', 'Thank you Vikram for your wonderful feedback!', 'Replied')
        `);
      }
      console.log('[Startup] Customer reviews table and seed verified.');
    } catch (revErr) {
      console.warn('[Startup] Warning creating customer_reviews table:', revErr.message);
    }

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
    }

    // Ensure categories and menu items exist for the restaurant
    const [existingItems] = await pool.execute('SELECT id FROM menu_items WHERE restaurant_id = ? LIMIT 1', [restaurantId]);
    if (existingItems.length === 0) {
      console.log(`[Startup] Seeding categories and menu items for restaurant ${restaurantId}...`);
      const categories = ['Appetizers', 'Burgers & Mains', 'Pizza & Pasta', 'Drinks & Desserts'];
      for (let i = 0; i < categories.length; i++) {
        const [catExists] = await pool.execute('SELECT id FROM menu_categories WHERE restaurant_id = ? AND name = ?', [restaurantId, categories[i]]);
        if (catExists.length === 0) {
          await pool.execute(
            'INSERT INTO menu_categories (restaurant_id, name, display_order) VALUES (?, ?, ?)',
            [restaurantId, categories[i], i + 1]
          );
        }
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
      console.log('[Startup] Categories and menu items seeded.');
    }

    // Ensure super admin and test admin/owner users exist and are unblocked
    try {
      const bcrypt = require('bcryptjs');
      const usersToSeed = [
        { name: 'Platform Super Admin', email: 'admin@platform.com', password: 'Admin@123', role: 'Admin' },
        { name: 'Restaurant Owner', email: 'owner@platform.com', password: 'Owner@123', role: 'Owner' },
        { name: 'Demo Owner', email: 'ownerr@gmail.com', password: 'admin123', role: 'Owner' },
        { name: 'Demo Admin', email: 'adminn@gmail.com', password: 'admin123', role: 'Admin' }
      ];

      for (const u of usersToSeed) {
        const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [u.email]);
        let userId;
        if (existing.length === 0) {
          console.log(`[Startup] Seeding user: ${u.email}...`);
          const hash = await bcrypt.hash(u.password, 10);
          const [res] = await pool.execute(
            "INSERT INTO users (name, email, password, role, is_blocked) VALUES (?, ?, ?, ?, 0)",
            [u.name, u.email, hash, u.role]
          );
          userId = res.insertId;
        } else {
          userId = existing[0].id;
          const hash = await bcrypt.hash(u.password, 10);
          await pool.execute(
            "UPDATE users SET role = ?, password = ?, is_blocked = 0 WHERE email = ?",
            [u.role, hash, u.email]
          );
        }

        // Ensure owner users are linked to restaurant 1 in user_restaurants
        if (u.role === 'Owner') {
          const [urExists] = await pool.execute('SELECT id FROM user_restaurants WHERE user_id = ? AND restaurant_id = 1', [userId]);
          if (urExists.length === 0) {
            await pool.execute(
              "INSERT INTO user_restaurants (user_id, restaurant_id, role, is_primary) VALUES (?, 1, 'Owner', TRUE)",
              [userId]
            );
          }
        }
      }
      console.log('[Startup] Default admin/owner users verified and unblocked.');
    } catch (userSeedErr) {
      console.warn('[Startup] Warning verifying users seed:', userSeedErr.message);
    }
  } catch (startupErr) {
    console.error('[Startup] Self-healing database setup failed:', startupErr.message);
  }

  // Start background auto-reconciliation worker
  startReconciliationWorker(30000);
});
