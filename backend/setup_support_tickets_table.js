const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });

    // 1. Create support_tickets table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticket_number VARCHAR(50) NOT NULL UNIQUE,
        restaurant_id INT NULL,
        restaurant_name VARCHAR(255) NULL,
        user_id INT NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        category ENUM('Technical', 'Order Dispute', 'Payout & Billing', 'Menu Sync', 'General Inquiry') DEFAULT 'General Inquiry',
        priority ENUM('Low', 'Medium', 'High', 'Urgent') DEFAULT 'Medium',
        status ENUM('Open', 'In Progress', 'Resolved', 'Closed') DEFAULT 'Open',
        message TEXT NOT NULL,
        admin_response TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP NULL
      )
    `);

    console.log('✅ Created support_tickets table in MySQL!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error setting up support_tickets table:', err);
    process.exit(1);
  }
})();
