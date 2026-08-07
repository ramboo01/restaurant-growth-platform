module.exports = {
  name: '033_enhance_catering_schema',
  up: async (pool) => {
    // Helper function to safely add columns
    const addColumnIfNotExists = async (tableName, columnName, columnDefinition) => {
      const [columns] = await pool.execute(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [tableName, columnName]
      );
      if (columns.length === 0) {
        await pool.execute(
          `ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${columnDefinition}`
        );
      }
    };

    await addColumnIfNotExists('catering_installments', 'company_name', "VARCHAR(150) NULL DEFAULT 'Corporate Client'");
    await addColumnIfNotExists('catering_installments', 'contact_person', "VARCHAR(100) NULL DEFAULT 'Event Host'");
    await addColumnIfNotExists('catering_installments', 'contact_phone', "VARCHAR(30) NULL DEFAULT ''");
    await addColumnIfNotExists('catering_installments', 'contact_email', "VARCHAR(100) NULL DEFAULT ''");
    await addColumnIfNotExists('catering_installments', 'event_date', "VARCHAR(50) NULL DEFAULT ''");
    await addColumnIfNotExists('catering_installments', 'event_time', "VARCHAR(50) NULL DEFAULT ''");
    await addColumnIfNotExists('catering_installments', 'venue_address', "TEXT NULL");
    await addColumnIfNotExists('catering_installments', 'headcount', "INT NOT NULL DEFAULT 50");
    await addColumnIfNotExists('catering_installments', 'package_tier', "VARCHAR(50) NOT NULL DEFAULT 'Executive'");
    await addColumnIfNotExists('catering_installments', 'dietary_notes', "TEXT NULL");
    await addColumnIfNotExists('catering_installments', 'payment_plan', "VARCHAR(50) NOT NULL DEFAULT 'Installments'");

    // Update existing seed records with realistic details
    await pool.execute(`
      UPDATE catering_installments 
      SET company_name = 'Acme Global Corp', 
          contact_person = guest_name,
          contact_phone = '+1 (555) 234-5678',
          contact_email = 'catering@acmeglobal.com',
          event_date = '2026-08-25',
          event_time = '12:30 PM',
          venue_address = '100 Innovation Way, Suite 400, New York, NY',
          headcount = 75,
          package_tier = 'Executive',
          dietary_notes = '5 Vegan meals required, 2 Gluten-Free',
          payment_plan = 'Installments'
      WHERE company_name = 'Corporate Client' OR company_name IS NULL
    `);
  }
};
