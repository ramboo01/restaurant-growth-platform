require('dotenv').config();
const { getDatabasePool } = require('../config/database');

async function migrate() {
  const pool = getDatabasePool();
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS seo_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NOT NULL,
        meta_title VARCHAR(255) NOT NULL,
        meta_description VARCHAR(500) NOT NULL,
        meta_keywords VARCHAR(500) NOT NULL,
        structured_data_json TEXT,
        sitemap_enabled BOOLEAN DEFAULT TRUE,
        last_submitted_sitemap TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE INDEX(restaurant_id)
      )
    `);

    // Insert mock seo settings if empty
    const [rows] = await pool.execute('SELECT COUNT(*) as cnt FROM seo_settings');
    if (rows[0].cnt === 0) {
      await pool.execute(`
        INSERT INTO seo_settings (restaurant_id, meta_title, meta_description, meta_keywords, structured_data_json)
        VALUES 
        (1, 'Best Italian Pizza & Pasta in Town | RestruRent', 'Taste authentic stone-baked Italian pizza and artisan fresh pasta made from organic local ingredients. Order online now for fast contact-free delivery.', 'italian food, pizza delivery, pasta near me, best italian restaurant', '{"@context":"https://schema.org","@type":"Restaurant","name":"RestruRent","image":"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4","priceRange":"$$"}')
      `);
    }

    console.log('SEO Settings table created and seeded successfully.');
    process.exit(0);
  } catch (error) {
    console.error('SEO migration failed:', error);
    process.exit(1);
  }
}

migrate();
