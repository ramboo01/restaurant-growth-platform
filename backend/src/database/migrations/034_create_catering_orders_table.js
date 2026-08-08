module.exports = {
  name: '034_create_catering_orders_table',
  up: async (pool) => {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS catering_orders (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NOT NULL,
        restaurant_name VARCHAR(150) DEFAULT '',
        company_name VARCHAR(150) NOT NULL,
        contact_person VARCHAR(100) NOT NULL,
        contact_phone VARCHAR(30) NOT NULL,
        contact_email VARCHAR(100) NOT NULL,
        event_name VARCHAR(200) DEFAULT '',
        event_date DATE NOT NULL,
        event_time VARCHAR(20) NOT NULL DEFAULT '12:00',
        venue_address TEXT NOT NULL,
        headcount INT NOT NULL DEFAULT 20,
        package_tier VARCHAR(50) NOT NULL DEFAULT 'Executive',
        menu_items JSON DEFAULT NULL,
        dietary_notes TEXT DEFAULT NULL,
        total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        deposit_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        payment_plan VARCHAR(50) NOT NULL DEFAULT 'Installments',
        status VARCHAR(50) NOT NULL DEFAULT 'New Inquiry',
        owner_notes TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_catering_restaurant (restaurant_id),
        INDEX idx_catering_email (contact_email),
        INDEX idx_catering_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  }
};
