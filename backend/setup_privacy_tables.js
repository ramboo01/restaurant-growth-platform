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

    // 1. Create guest_privacy_requests table if not exists
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS guest_privacy_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        guest_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        reason VARCHAR(255) NULL,
        status ENUM('Pending', 'Completed', 'Rejected') DEFAULT 'Pending',
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP NULL
      )
    `);

    // 2. Check if table is empty, insert demo pending requests
    const [existingReqs] = await pool.execute('SELECT COUNT(*) AS cnt FROM guest_privacy_requests');
    if (existingReqs[0].cnt === 0) {
      await pool.execute(`
        INSERT INTO guest_privacy_requests (user_id, guest_name, email, reason, status, requested_at)
        VALUES 
        (103, 'John Customer', 'customer_1784889884909@test.com', 'Requested full PII deletion under GDPR Article 17 (Right to be Forgotten)', 'Pending', NOW()),
        (144, 'John Doe Test', 'john.doe.test@example.com', 'Closing account and removing marketing data', 'Pending', NOW() - INTERVAL 1 DAY)
      `);
      console.log('✅ Seeded demo GDPR Privacy Requests');
    }

    // 3. Ensure profile_merge_queue has pending items
    const [existingMerges] = await pool.execute('SELECT COUNT(*) AS cnt FROM profile_merge_queue WHERE status = "Pending"');
    if (existingMerges[0].cnt === 0) {
      await pool.execute(`
        INSERT INTO profile_merge_queue (primary_guest_id, duplicate_guest_id, primary_name, duplicate_name, match_reason, status, created_at)
        VALUES 
        (101, 108, 'Test Owner (ID #101)', 'Test Owner Gemini (ID #108)', 'Matching Phone: +1-555-0199 & Duplicate Email', 'Pending', NOW()),
        (107, 146, 'Owner Name (ID #107)', 'Owner Name (ID #146)', 'Exact Name & Matching Restaurant', 'Pending', NOW() - INTERVAL 2 DAY)
      `);
      console.log('✅ Seeded demo Profile Merge Queue items');
    }

    console.log('🎉 GDPR & Profile Merge Queue database setup completed!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error setting up privacy tables:', err);
    process.exit(1);
  }
})();
