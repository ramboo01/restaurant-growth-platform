module.exports = {
  name: '022_add_campaign_fields_and_user_notifications',
  up: async (pool) => {
    // 1. Add user_id and discount_code to notifications table if not existing
    try {
      await pool.execute(`ALTER TABLE notifications ADD COLUMN user_id INT NULL`);
    } catch (err) {
      // Column may already exist
    }

    try {
      await pool.execute(`ALTER TABLE notifications ADD COLUMN discount_code VARCHAR(50) NULL`);
    } catch (err) {
      // Column may already exist
    }

    // 2. Add conversions_count and revenue_generated to campaigns table if not existing
    try {
      await pool.execute(`ALTER TABLE campaigns ADD COLUMN conversions_count INT NOT NULL DEFAULT 0`);
    } catch (err) {
      // Column may already exist
    }

    try {
      await pool.execute(`ALTER TABLE campaigns ADD COLUMN revenue_generated DECIMAL(10,2) NOT NULL DEFAULT 0.00`);
    } catch (err) {
      // Column may already exist
    }
  }
};
