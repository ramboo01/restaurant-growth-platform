require('dotenv').config();
const { getDatabasePool } = require('../config/database');

async function migrate() {
  const pool = getDatabasePool();
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS customer_reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        platform ENUM('Google', 'Yelp', 'Direct') DEFAULT 'Direct',
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        content TEXT NOT NULL,
        ai_reply_draft TEXT,
        reply_status ENUM('Pending', 'Replied') DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX(restaurant_id),
        INDEX(reply_status)
      )
    `);
    
    // Insert some mock data if empty
    const [rows] = await pool.execute('SELECT COUNT(*) as cnt FROM customer_reviews');
    if (rows[0].cnt === 0) {
      await pool.execute(`
        INSERT INTO customer_reviews (restaurant_id, customer_name, platform, rating, content, created_at)
        VALUES 
        (1, 'Alice Johnson', 'Google', 5, 'Absolutely loved the truffle fries and the ambiance! Will come back.', DATE_SUB(NOW(), INTERVAL 2 DAY)),
        (1, 'Mark Smith', 'Yelp', 3, 'Service was a bit slow during rush hour, but the food was decent.', DATE_SUB(NOW(), INTERVAL 5 DAY)),
        (1, 'Sarah Connor', 'Direct', 1, 'My steak was overcooked and cold. Very disappointed.', DATE_SUB(NOW(), INTERVAL 1 DAY))
      `);
    }

    console.log('Customer reviews table created and seeded successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
