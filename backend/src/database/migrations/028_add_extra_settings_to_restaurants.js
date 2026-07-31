module.exports = {
  name: '028_add_extra_settings_to_restaurants',
  up: async (pool) => {
    // Helper function to check if column exists
    const checkAndAddColumn = async (tableName, columnName, definition) => {
      const [cols] = await pool.execute(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
      `, [tableName, columnName]);
      
      if (cols.length === 0) {
        await pool.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
        console.log(`[migrate] Added column ${columnName} to ${tableName}`);
      }
    };

    await checkAndAddColumn('restaurants', 'weekly_schedule', "VARCHAR(100) DEFAULT 'Mon-Sun'");
    await checkAndAddColumn('restaurants', 'gst', 'DECIMAL(5,2) DEFAULT 5.00');
    await checkAndAddColumn('restaurants', 'service_charge', 'DECIMAL(5,2) DEFAULT 10.00');
    await checkAndAddColumn('restaurants', 'cash', 'BOOLEAN DEFAULT TRUE');
    await checkAndAddColumn('restaurants', 'card', 'BOOLEAN DEFAULT TRUE');
    await checkAndAddColumn('restaurants', 'upi', 'BOOLEAN DEFAULT TRUE');
    await checkAndAddColumn('restaurants', 'wallet', 'BOOLEAN DEFAULT FALSE');
    await checkAndAddColumn('restaurants', 'primary_color', "VARCHAR(7) DEFAULT '#1f2933'");
    await checkAndAddColumn('restaurants', 'secondary_color', "VARCHAR(7) DEFAULT '#d9973f'");
    await checkAndAddColumn('restaurants', 'email_notifications', 'BOOLEAN DEFAULT TRUE');
    await checkAndAddColumn('restaurants', 'sms_notifications', 'BOOLEAN DEFAULT FALSE');
    await checkAndAddColumn('restaurants', 'push_notifications', 'BOOLEAN DEFAULT TRUE');
    await checkAndAddColumn('restaurants', 'logo_url', 'VARCHAR(255) DEFAULT NULL');
    await checkAndAddColumn('restaurants', 'banner_url', 'VARCHAR(255) DEFAULT NULL');
  }
};
