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

    // Seed one realistic demo entry
    const [existing] = await pool.execute(`SELECT id FROM catering_orders LIMIT 1`);
    if (existing.length === 0) {
      await pool.execute(`
        INSERT INTO catering_orders
          (restaurant_id, restaurant_name, company_name, contact_person, contact_phone, contact_email,
           event_name, event_date, event_time, venue_address, headcount, package_tier,
           dietary_notes, total_amount, deposit_amount, paid_amount, payment_plan, status)
        VALUES
          (1, 'Pulse Valley', 'TechNova Solutions', 'Priya Sharma', '+91 98765-43210', 'events@technova.in',
           'Annual Team Offsite Lunch', '2026-08-20', '12:30', '14th Floor, WeWork Galaxy, Residency Rd, Bangalore 560025',
           80, 'Executive', '10 Jain meals, 5 Vegan, No peanuts for 3 guests',
           2000.00, 500.00, 500.00, 'Installments', 'Confirmed'),
          (1, 'Pulse Valley', 'GlobalSync Media', 'Rahul Verma', '+91 87654-32100', 'rahul@globalsync.co',
           'Client Welcome Dinner', '2026-08-28', '19:00', 'Taj Vivanta Ballroom, MG Road, Bangalore 560001',
           120, 'Luxury', '15 Vegetarian, 2 Gluten-free',
           5400.00, 1350.00, 1350.00, 'Installments', 'New Inquiry')
      `);
    }
  }
};
