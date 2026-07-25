module.exports = {
  name: '018_create_campaigns_table',
  up: async (pool) => {
    // 1. Create campaigns table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        channel ENUM('SMS', 'Email', 'WhatsApp') NOT NULL DEFAULT 'Email',
        segment_target VARCHAR(100) NOT NULL DEFAULT 'All Customers',
        subject VARCHAR(255) NULL,
        content TEXT NOT NULL,
        discount_code VARCHAR(50) NULL,
        status ENUM('Draft', 'Scheduled', 'Sent') NOT NULL DEFAULT 'Draft',
        recipient_count INT NOT NULL DEFAULT 0,
        sent_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
      )
    `);

    // 2. Seed initial campaigns for default restaurant
    const [restaurants] = await pool.execute('SELECT id FROM restaurants LIMIT 1');
    if (restaurants.length > 0) {
      const restaurantId = restaurants[0].id;
      const [existing] = await pool.execute('SELECT id FROM campaigns WHERE restaurant_id = ? LIMIT 1', [restaurantId]);
      if (existing.length === 0) {
        await pool.execute(
          `INSERT INTO campaigns (restaurant_id, name, channel, segment_target, subject, content, discount_code, status, recipient_count, sent_at)
           VALUES 
           (?, 'VIP Weekend Special 20% Off', 'Email', 'VIP Guests', 'Special Treat for our Top VIPs!', 'Enjoy 20% off your entire order this weekend with code VIP20.', 'VIP20', 'Sent', 48, NOW()),
           (?, 'We Miss You - Free Dessert', 'SMS', 'At Risk (30+ Days Inactive)', NULL, 'We miss you at RestruRent! Come back for a FREE dessert on your next order: DESSERTFREE', 'DESSERTFREE', 'Sent', 124, NOW()),
           (?, 'New Menu Launch Announcement', 'WhatsApp', 'All Customers', NULL, 'Check out our freshly launched artisan pizzas and burgers! Order direct & save.', NULL, 'Draft', 350, NULL)`,
          [restaurantId, restaurantId, restaurantId]
        );
      }
    }
  }
};
