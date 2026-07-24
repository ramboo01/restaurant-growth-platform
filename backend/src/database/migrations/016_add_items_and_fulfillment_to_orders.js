module.exports = {
  name: '016_add_items_and_fulfillment_to_orders',
  up: async (pool) => {
    // Check if columns exist first (idempotency)
    const [columns] = await pool.execute("SHOW COLUMNS FROM orders LIKE 'items'");
    if (columns.length === 0) {
      await pool.execute(`
        ALTER TABLE orders
        ADD COLUMN items JSON DEFAULT NULL,
        ADD COLUMN fulfillment_details JSON DEFAULT NULL,
        ADD COLUMN special_instructions TEXT DEFAULT NULL
      `);
    }
  }
};
