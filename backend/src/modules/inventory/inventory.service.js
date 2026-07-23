const { getDatabasePool } = require('../../config/database');
const { parseListOptions, executePaginatedQuery } = require('../../utils/pagination');

const INVENTORY_STATUSES = ['In Stock', 'Low Stock', 'Out of Stock'];
const INVENTORY_SORT_MAP = {
  itemName: 'item_name',
  category: 'category',
  quantity: 'quantity',
  status: 'status',
  createdAt: 'created_at'
};

async function createInventoryItem(payload) {
  const [result] = await getDatabasePool().execute(
    `INSERT INTO inventory
      (restaurant_id, item_name, category, unit, quantity, minimum_quantity, supplier, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.restaurantId,
      payload.itemName.trim(),
      payload.category.trim(),
      payload.unit.trim(),
      payload.quantity,
      payload.minimumQuantity,
      payload.supplier.trim(),
      payload.status
    ]
  );

  return getInventoryItemById(result.insertId);
}

async function getInventoryItems(query = {}) {
  const pool = getDatabasePool();
  const options = parseListOptions(query, { sortMap: INVENTORY_SORT_MAP });
  const whereClauses = [];
  const params = [];

  if (options.search) {
    whereClauses.push('(item_name LIKE ? OR supplier LIKE ? OR category LIKE ?)');
    const pattern = `%${options.search}%`;
    params.push(pattern, pattern, pattern);
  }

  if (query.status) {
    whereClauses.push('status = ?');
    params.push(query.status);
  }

  if (query.category) {
    whereClauses.push('category = ?');
    params.push(query.category);
  }

  return executePaginatedQuery({
    pool,
    selectClause: `SELECT id, restaurant_id AS restaurantId, item_name AS itemName, category, unit, quantity, minimum_quantity AS minimumQuantity, supplier, status, created_at AS createdAt`,
    fromClause: 'FROM inventory',
    whereClauses,
    params,
    sortColumn: options.sortColumn,
    order: options.order,
    page: options.page,
    limit: options.limit,
    offset: options.offset
  });
}

async function getInventoryItemById(id) {
  const [rows] = await getDatabasePool().execute(
    `SELECT id, restaurant_id AS restaurantId, item_name AS itemName, category, unit, quantity, minimum_quantity AS minimumQuantity, supplier, status, created_at AS createdAt
     FROM inventory
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

async function getInventoryByRestaurantId(restaurantId, query = {}) {
  const pool = getDatabasePool();
  const options = parseListOptions(query, { sortMap: INVENTORY_SORT_MAP });
  const whereClauses = ['restaurant_id = ?'];
  const params = [restaurantId];

  if (options.search) {
    whereClauses.push('(item_name LIKE ? OR supplier LIKE ? OR category LIKE ?)');
    const pattern = `%${options.search}%`;
    params.push(pattern, pattern, pattern);
  }

  if (query.status) {
    whereClauses.push('status = ?');
    params.push(query.status);
  }

  if (query.category) {
    whereClauses.push('category = ?');
    params.push(query.category);
  }

  return executePaginatedQuery({
    pool,
    selectClause: `SELECT id, restaurant_id AS restaurantId, item_name AS itemName, category, unit, quantity, minimum_quantity AS minimumQuantity, supplier, status, created_at AS createdAt`,
    fromClause: 'FROM inventory',
    whereClauses,
    params,
    sortColumn: options.sortColumn,
    order: options.order,
    page: options.page,
    limit: options.limit,
    offset: options.offset
  });
}

async function updateInventoryItem(id, payload) {
  const [result] = await getDatabasePool().execute(
    `UPDATE inventory
     SET restaurant_id = ?, item_name = ?, category = ?, unit = ?, quantity = ?, minimum_quantity = ?, supplier = ?, status = ?
     WHERE id = ?`,
    [
      payload.restaurantId,
      payload.itemName.trim(),
      payload.category.trim(),
      payload.unit.trim(),
      payload.quantity,
      payload.minimumQuantity,
      payload.supplier.trim(),
      payload.status,
      id
    ]
  );

  return result.affectedRows > 0 ? getInventoryItemById(id) : null;
}

async function deleteInventoryItem(id) {
  const [result] = await getDatabasePool().execute('DELETE FROM inventory WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = {
  INVENTORY_STATUSES,
  createInventoryItem,
  getInventoryItems,
  getInventoryItemById,
  getInventoryByRestaurantId,
  updateInventoryItem,
  deleteInventoryItem
};
