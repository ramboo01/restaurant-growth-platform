const mysql = require('mysql2/promise');
const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = require('../config/env');

const FK_TARGETS = [
  { table: 'menu_items', column: 'restaurant_id', refTable: 'restaurants', refColumn: 'id', name: 'fk_menu_items_restaurant_id' },
  { table: 'menu_categories', column: 'restaurant_id', refTable: 'restaurants', refColumn: 'id', name: 'fk_menu_categories_restaurant_id' },
  { table: 'orders', column: 'restaurant_id', refTable: 'restaurants', refColumn: 'id', name: 'fk_orders_restaurant_id' },
  { table: 'staff', column: 'restaurant_id', refTable: 'restaurants', refColumn: 'id', name: 'fk_staff_restaurant_id' },
  { table: 'drivers', column: 'restaurant_id', refTable: 'restaurants', refColumn: 'id', name: 'fk_drivers_restaurant_id' },
  { table: 'inventory', column: 'restaurant_id', refTable: 'restaurants', refColumn: 'id', name: 'fk_inventory_restaurant_id' },
  { table: 'loyalty_members', column: 'restaurant_id', refTable: 'restaurants', refColumn: 'id', name: 'fk_loyalty_members_restaurant_id' },
  { table: 'customers', column: 'restaurant_id', refTable: 'restaurants', refColumn: 'id', name: 'fk_customers_restaurant_id' },
  { table: 'notifications', column: 'restaurant_id', refTable: 'restaurants', refColumn: 'id', name: 'fk_notifications_restaurant_id' }
];

const INDEX_TARGETS = [
  { table: 'orders', column: 'order_status', name: 'idx_orders_order_status' },
  { table: 'orders', column: 'created_at', name: 'idx_orders_created_at' },
  { table: 'menu_items', column: 'is_available', name: 'idx_menu_items_is_available' },
  { table: 'menu_items', column: 'created_at', name: 'idx_menu_items_created_at' },
  { table: 'menu_categories', column: 'display_order', name: 'idx_menu_categories_display_order' },
  { table: 'staff', column: 'status', name: 'idx_staff_status' },
  { table: 'drivers', column: 'status', name: 'idx_drivers_status' },
  { table: 'inventory', column: 'status', name: 'idx_inventory_status' },
  { table: 'inventory', column: 'item_name', name: 'idx_inventory_item_name' },
  { table: 'loyalty_members', column: 'phone', name: 'idx_loyalty_members_phone' },
  { table: 'customers', column: 'phone', name: 'idx_customers_phone' },
  { table: 'notifications', column: 'is_read', name: 'idx_notifications_is_read' },
  { table: 'notifications', column: 'created_at', name: 'idx_notifications_created_at' }
];

async function columnHasData(conn, table, column) {
  const [rows] = await conn.execute(`SELECT COUNT(*) AS count FROM \`${table}\` WHERE \`${column}\` IS NOT NULL`);
  return Number(rows[0]?.count) > 0;
}

async function foreignKeyExists(conn, table, name) {
  const [rows] = await conn.execute(
    `SELECT CONSTRAINT_NAME AS constraintName
     FROM information_schema.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY' AND CONSTRAINT_NAME = ?`,
    [DB_NAME, table, name]
  );
  return rows.length > 0;
}

async function indexExists(conn, table, name) {
  const [rows] = await conn.execute(
    `SELECT INDEX_NAME AS indexName
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [DB_NAME, table, name]
  );
  return rows.length > 0;
}

async function main() {
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT),
    database: DB_NAME,
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: false
  });

  const applied = { tablesUpdated: [], foreignKeysAdded: [], indexesAdded: [], skipped: [] };

  for (const target of FK_TARGETS) {
    const exists = await foreignKeyExists(conn, target.table, target.name);
    if (exists) {
      continue;
    }

    const sql = `ALTER TABLE \`${target.table}\` ADD CONSTRAINT \`${target.name}\` FOREIGN KEY (\`${target.column}\`) REFERENCES \`${target.refTable}\`(\`${target.refColumn}\`) ON DELETE CASCADE ON UPDATE CASCADE`;
    try {
      await conn.execute(sql);
      applied.tablesUpdated.push(target.table);
      applied.foreignKeysAdded.push(target.name);
    } catch (error) {
      applied.skipped.push({ type: 'foreignKey', name: target.name, table: target.table, message: error.message });
    }
  }

  for (const target of INDEX_TARGETS) {
    const exists = await indexExists(conn, target.table, target.name);
    if (exists) {
      continue;
    }

    try {
      await conn.execute(`ALTER TABLE \`${target.table}\` ADD INDEX \`${target.name}\` (\`${target.column}\`)`);
      if (!applied.tablesUpdated.includes(target.table)) {
        applied.tablesUpdated.push(target.table);
      }
      applied.indexesAdded.push(target.name);
    } catch (error) {
      applied.skipped.push({ type: 'index', name: target.name, table: target.table, message: error.message });
    }
  }

  console.log(JSON.stringify(applied, null, 2));
  await conn.end();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
