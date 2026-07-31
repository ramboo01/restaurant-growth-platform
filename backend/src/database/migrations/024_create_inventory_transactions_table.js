module.exports = {
  name: '024_create_inventory_transactions_table',
  up: async (pool) => {
    // 1. Add cost_per_unit to existing inventory table
    try {
      await pool.execute(`ALTER TABLE inventory ADD COLUMN cost_per_unit DECIMAL(10, 2) DEFAULT 0.00`);
    } catch (err) {
      if (!err.message.includes('Duplicate column')) throw err;
    }

    // 2. Create inventory_transactions table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS inventory_transactions (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        inventory_id INT NOT NULL,
        restaurant_id INT NOT NULL,
        type ENUM('Stock In', 'Usage', 'Wastage', 'Adjustment', 'Order Deduction') NOT NULL,
        quantity DECIMAL(10, 2) NOT NULL,
        previous_stock DECIMAL(10, 2) NOT NULL DEFAULT 0,
        new_stock DECIMAL(10, 2) NOT NULL DEFAULT 0,
        performed_by VARCHAR(255) NOT NULL DEFAULT 'System',
        notes TEXT,
        cost_per_unit DECIMAL(10, 2) DEFAULT 0.00,
        reference_id VARCHAR(100),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE,
        INDEX idx_inv_txn_restaurant (restaurant_id),
        INDEX idx_inv_txn_type (type),
        INDEX idx_inv_txn_created (created_at)
      )
    `);

    // 3. Seed default cost_per_unit for existing inventory items
    await pool.execute(`UPDATE inventory SET cost_per_unit = 2.50 WHERE item_name = 'Beef Patty' AND cost_per_unit = 0`);
    await pool.execute(`UPDATE inventory SET cost_per_unit = 0.80 WHERE item_name = 'Brioche Bun' AND cost_per_unit = 0`);
    await pool.execute(`UPDATE inventory SET cost_per_unit = 8.50 WHERE item_name = 'Mozzarella Cheese' AND cost_per_unit = 0`);
    await pool.execute(`UPDATE inventory SET cost_per_unit = 1.20 WHERE item_name = 'Pizza Dough' AND cost_per_unit = 0`);
    await pool.execute(`UPDATE inventory SET cost_per_unit = 18.00 WHERE item_name = 'Coffee Beans' AND cost_per_unit = 0`);
  }
};
