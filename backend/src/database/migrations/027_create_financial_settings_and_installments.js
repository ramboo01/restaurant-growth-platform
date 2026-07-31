module.exports = {
  name: '027_create_financial_settings_and_installments',
  up: async (pool) => {
    // 1. Create financial_settings table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS financial_settings (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NOT NULL UNIQUE,
        allow_installments BOOLEAN NOT NULL DEFAULT TRUE,
        deposit_pct INT NOT NULL DEFAULT 25,
        is_subsidized BOOLEAN NOT NULL DEFAULT FALSE,
        instant_pay_fee DECIMAL(5,2) NOT NULL DEFAULT 1.99,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 2. Create catering_installments table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS catering_installments (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NOT NULL,
        guest_name VARCHAR(100) NOT NULL,
        event_name VARCHAR(150) NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        deposit_amount DECIMAL(10,2) NOT NULL,
        paid_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'In Progress',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_restaurant_id (restaurant_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Seed default settings for restaurant 1 if not exists
    const [existingSettings] = await pool.execute(
      `SELECT id FROM financial_settings WHERE restaurant_id = 1`
    );
    if (existingSettings.length === 0) {
      await pool.execute(
        `INSERT INTO financial_settings (restaurant_id, allow_installments, deposit_pct, is_subsidized, instant_pay_fee) 
         VALUES (1, TRUE, 25, FALSE, 1.99)`
      );
    }

    // Seed default installments for restaurant 1 if not exists
    const [existingInstallments] = await pool.execute(
      `SELECT id FROM catering_installments WHERE restaurant_id = 1`
    );
    if (existingInstallments.length === 0) {
      await pool.execute(
        `INSERT INTO catering_installments (restaurant_id, guest_name, event_name, total_amount, deposit_amount, paid_amount, status) 
         VALUES 
         (1, 'Sarah Jenkins', 'Corporate Catering Launch', 1200.00, 300.00, 600.00, 'In Progress'),
         (1, 'Michael Chang', 'Wedding Reception Prep', 3500.00, 875.00, 875.00, 'Awaiting Installment #2')`
      );
    }
  }
};
