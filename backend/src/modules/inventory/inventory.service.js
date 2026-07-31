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

// ─── Transaction Engine ───────────────────────────────────────

async function recordTransaction(pool, { inventoryId, restaurantId, type, quantity, performedBy, notes, costPerUnit, referenceId }) {
  // Get current stock
  const [rows] = await pool.execute('SELECT quantity, minimum_quantity FROM inventory WHERE id = ?', [inventoryId]);
  if (rows.length === 0) throw new Error('Inventory item not found');

  const previousStock = Number(rows[0].quantity);
  const minQty = Number(rows[0].minimum_quantity);
  let newStock;

  if (type === 'Stock In') {
    newStock = previousStock + Number(quantity);
  } else {
    // Usage, Wastage, Order Deduction subtract; Adjustment can go either way
    newStock = type === 'Adjustment' ? Number(quantity) : previousStock - Number(quantity);
  }
  newStock = Math.max(0, newStock);

  // Determine new status
  let newStatus = 'In Stock';
  if (newStock <= 0) newStatus = 'Out of Stock';
  else if (newStock <= minQty) newStatus = 'Low Stock';

  // Update inventory quantity + status
  await pool.execute(
    'UPDATE inventory SET quantity = ?, status = ? WHERE id = ?',
    [newStock, newStatus, inventoryId]
  );

  // Record transaction
  const [result] = await pool.execute(
    `INSERT INTO inventory_transactions 
      (inventory_id, restaurant_id, type, quantity, previous_stock, new_stock, performed_by, notes, cost_per_unit, reference_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [inventoryId, restaurantId, type, quantity, previousStock, newStock, performedBy || 'System', notes || '', costPerUnit || 0, referenceId || null]
  );

  return {
    id: result.insertId,
    inventoryId,
    type,
    quantity: Number(quantity),
    previousStock,
    newStock,
    performedBy: performedBy || 'System',
    notes: notes || ''
  };
}

async function stockIn(inventoryId, restaurantId, payload) {
  const pool = getDatabasePool();
  return recordTransaction(pool, {
    inventoryId,
    restaurantId,
    type: 'Stock In',
    quantity: payload.quantity,
    performedBy: payload.performedBy,
    notes: payload.notes || `Stock received: ${payload.quantity} units`,
    costPerUnit: payload.costPerUnit,
    referenceId: payload.referenceId
  });
}

async function recordUsage(inventoryId, restaurantId, payload) {
  const pool = getDatabasePool();
  return recordTransaction(pool, {
    inventoryId,
    restaurantId,
    type: 'Usage',
    quantity: payload.quantity,
    performedBy: payload.performedBy,
    notes: payload.notes || `Manual usage: ${payload.quantity} units`,
    costPerUnit: payload.costPerUnit
  });
}

async function recordWastage(inventoryId, restaurantId, payload) {
  const pool = getDatabasePool();
  return recordTransaction(pool, {
    inventoryId,
    restaurantId,
    type: 'Wastage',
    quantity: payload.quantity,
    performedBy: payload.performedBy,
    notes: payload.notes || `Wastage/spoilage: ${payload.quantity} units`,
    costPerUnit: payload.costPerUnit
  });
}

async function adjustStock(inventoryId, restaurantId, payload) {
  const pool = getDatabasePool();
  return recordTransaction(pool, {
    inventoryId,
    restaurantId,
    type: 'Adjustment',
    quantity: payload.newQuantity,
    performedBy: payload.performedBy,
    notes: payload.notes || `Stock adjusted to ${payload.newQuantity}`,
    costPerUnit: payload.costPerUnit
  });
}

async function getTransactions(restaurantId, query = {}) {
  const pool = getDatabasePool();
  let sql = `SELECT t.id, t.inventory_id AS inventoryId, i.item_name AS itemName, i.unit,
                    t.type, t.quantity, t.previous_stock AS previousStock, t.new_stock AS newStock,
                    t.performed_by AS performedBy, t.notes, t.cost_per_unit AS costPerUnit,
                    t.reference_id AS referenceId, t.created_at AS createdAt
             FROM inventory_transactions t
             JOIN inventory i ON t.inventory_id = i.id
             WHERE t.restaurant_id = ?`;
  const params = [restaurantId];

  if (query.type) {
    sql += ' AND t.type = ?';
    params.push(query.type);
  }
  if (query.inventoryId) {
    sql += ' AND t.inventory_id = ?';
    params.push(query.inventoryId);
  }

  sql += ' ORDER BY t.created_at DESC LIMIT 100';

  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function getTransactionSummary(restaurantId) {
  const pool = getDatabasePool();

  // Total inventory value
  const [valueRows] = await pool.execute(
    'SELECT SUM(quantity * cost_per_unit) AS totalValue FROM inventory WHERE restaurant_id = ?',
    [restaurantId]
  );

  // Today's transactions by type
  const [todayRows] = await pool.execute(
    `SELECT type, COUNT(*) AS count, SUM(quantity) AS totalQty, SUM(quantity * cost_per_unit) AS totalCost
     FROM inventory_transactions
     WHERE restaurant_id = ? AND DATE(created_at) = CURDATE()
     GROUP BY type`,
    [restaurantId]
  );

  // Total wastage this month
  const [wastageRows] = await pool.execute(
    `SELECT SUM(quantity * cost_per_unit) AS wastageCost, SUM(quantity) AS wastageQty
     FROM inventory_transactions
     WHERE restaurant_id = ? AND type = 'Wastage' AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())`,
    [restaurantId]
  );

  return {
    totalInventoryValue: Number(valueRows[0]?.totalValue) || 0,
    todayActivity: todayRows,
    monthlyWastageCost: Number(wastageRows[0]?.wastageCost) || 0,
    monthlyWastageQty: Number(wastageRows[0]?.wastageQty) || 0
  };
}

async function deductInventoryForOrder(order) {
  const pool = getDatabasePool();
  let items = order.items;
  if (typeof items === 'string') {
    try {
      items = JSON.parse(items);
    } catch (e) {
      items = [];
    }
  }
  if (!Array.isArray(items)) {
    return;
  }

  for (const item of items) {
    const itemId = item.itemId;
    const itemQty = Number(item.quantity) || 1;

    if (!itemId) continue;

    // Get recipe for this menu item
    const [recipes] = await pool.execute(
      'SELECT inventory_id, quantity_required FROM recipes WHERE menu_item_id = ?',
      [itemId]
    );

    for (const recipe of recipes) {
      const deduction = Number(recipe.quantity_required) * itemQty;

      // Get restaurant_id for the inventory item
      const [invRows] = await pool.execute('SELECT restaurant_id FROM inventory WHERE id = ?', [recipe.inventory_id]);
      const restaurantId = invRows[0]?.restaurant_id || order.restaurantId || 1;

      await recordTransaction(pool, {
        inventoryId: recipe.inventory_id,
        restaurantId,
        type: 'Order Deduction',
        quantity: deduction,
        performedBy: 'System (Auto)',
        notes: `Auto-deducted for order ${order.orderNumber || ''}`,
        referenceId: order.orderNumber || ''
      });

      console.log(`[Inventory] Deducted ${deduction} units from inventory ID ${recipe.inventory_id} for order ${order.orderNumber}`);
    }
  }
}

module.exports = {
  INVENTORY_STATUSES,
  createInventoryItem,
  getInventoryItems,
  getInventoryItemById,
  getInventoryByRestaurantId,
  updateInventoryItem,
  deleteInventoryItem,
  deductInventoryForOrder,
  stockIn,
  recordUsage,
  recordWastage,
  adjustStock,
  getTransactions,
  getTransactionSummary
};

