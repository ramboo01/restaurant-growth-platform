module.exports = {
  name: '025_add_status_to_restaurants_and_franchise_settings',
  up: async (pool) => {
    // 1. Add status column to restaurants table
    const [cols] = await pool.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'restaurants' AND COLUMN_NAME = 'status'`
    );
    if (cols.length === 0) {
      await pool.execute(
        `ALTER TABLE restaurants ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'Active' AFTER closing_time`
      );
    }

    // 2. Create franchise_settings table for compliance controls
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS franchise_settings (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        owner_user_id INT NOT NULL,
        pricing_sync BOOLEAN NOT NULL DEFAULT TRUE,
        require_approval BOOLEAN NOT NULL DEFAULT FALSE,
        audit_logs BOOLEAN NOT NULL DEFAULT TRUE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_owner (owner_user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  }
};
