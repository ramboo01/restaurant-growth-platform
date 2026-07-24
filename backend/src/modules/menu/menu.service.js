const { getDatabasePool } = require('../../config/database');
const { parseListOptions, executePaginatedQuery } = require('../../utils/pagination');

const MENU_SORT_MAP = {
  name: 'name',
  category: 'category',
  price: 'price',
  createdAt: 'created_at'
};

async function createMenuItem(payload) {
  const pool = getDatabasePool();
  let restaurantId = payload.restaurantId;

  if (restaurantId) {
    const [exists] = await pool.execute('SELECT id FROM restaurants WHERE id = ? LIMIT 1', [restaurantId]);
    if (exists.length === 0) {
      const [defaultRest] = await pool.execute('SELECT id FROM restaurants LIMIT 1');
      if (defaultRest.length > 0) {
        restaurantId = defaultRest[0].id;
      }
    }
  } else {
    const [defaultRest] = await pool.execute('SELECT id FROM restaurants LIMIT 1');
    if (defaultRest.length > 0) {
      restaurantId = defaultRest[0].id;
    }
  }

  const [result] = await pool.execute(
    `INSERT INTO menu_items
      (restaurant_id, name, description, category, price, image_url, is_available)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      restaurantId,
      payload.name.trim(),
      payload.description.trim(),
      payload.category.trim(),
      payload.price,
      payload.imageUrl?.trim() || null,
      payload.isAvailable === undefined ? 1 : payload.isAvailable ? 1 : 0
    ]
  );

  return getMenuItemById(result.insertId);
}

async function getMenuItems(query = {}) {
  const pool = getDatabasePool();
  const options = parseListOptions(query, { sortMap: MENU_SORT_MAP });
  const whereClauses = [];
  const params = [];

  if (options.search) {
    whereClauses.push('(name LIKE ? OR description LIKE ? OR category LIKE ?)');
    const pattern = `%${options.search}%`;
    params.push(pattern, pattern, pattern);
  }

  return executePaginatedQuery({
    pool,
    selectClause: `SELECT id, restaurant_id AS restaurantId, name, description, category, price, image_url AS imageUrl, is_available AS isAvailable, created_at AS createdAt`,
    fromClause: 'FROM menu_items',
    whereClauses,
    params,
    sortColumn: options.sortColumn,
    order: options.order,
    page: options.page,
    limit: options.limit,
    offset: options.offset
  });
}

async function getMenuItemById(id) {
  const [rows] = await getDatabasePool().execute(
    `SELECT id, restaurant_id AS restaurantId, name, description, category, price, image_url AS imageUrl, is_available AS isAvailable, created_at AS createdAt
     FROM menu_items
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

async function updateMenuItem(id, payload) {
  const pool = getDatabasePool();
  let restaurantId = payload.restaurantId;

  if (restaurantId) {
    const [exists] = await pool.execute('SELECT id FROM restaurants WHERE id = ? LIMIT 1', [restaurantId]);
    if (exists.length === 0) {
      const [defaultRest] = await pool.execute('SELECT id FROM restaurants LIMIT 1');
      if (defaultRest.length > 0) {
        restaurantId = defaultRest[0].id;
      }
    }
  } else {
    const [defaultRest] = await pool.execute('SELECT id FROM restaurants LIMIT 1');
    if (defaultRest.length > 0) {
      restaurantId = defaultRest[0].id;
    }
  }

  const [result] = await pool.execute(
    `UPDATE menu_items
     SET restaurant_id = ?, name = ?, description = ?, category = ?, price = ?, image_url = ?, is_available = ?
     WHERE id = ?`,
    [
      restaurantId,
      payload.name.trim(),
      payload.description.trim(),
      payload.category.trim(),
      payload.price,
      payload.imageUrl?.trim() || null,
      payload.isAvailable === undefined ? 1 : payload.isAvailable ? 1 : 0,
      id
    ]
  );

  return result.affectedRows > 0 ? getMenuItemById(id) : null;
}

async function deleteMenuItem(id) {
  const [result] = await getDatabasePool().execute('DELETE FROM menu_items WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

async function getMenuItemsByRestaurantId(restaurantId, query = {}) {
  const pool = getDatabasePool();
  const options = parseListOptions(query, { sortMap: MENU_SORT_MAP });
  const whereClauses = ['restaurant_id = ?'];
  const params = [restaurantId];

  if (options.search) {
    whereClauses.push('(name LIKE ? OR description LIKE ? OR category LIKE ?)');
    const pattern = `%${options.search}%`;
    params.push(pattern, pattern, pattern);
  }

  return executePaginatedQuery({
    pool,
    selectClause: `SELECT id, restaurant_id AS restaurantId, name, description, category, price, image_url AS imageUrl, is_available AS isAvailable, created_at AS createdAt`,
    fromClause: 'FROM menu_items',
    whereClauses,
    params,
    sortColumn: options.sortColumn,
    order: options.order,
    page: options.page,
    limit: options.limit,
    offset: options.offset
  });
}

module.exports = {
  createMenuItem,
  getMenuItems,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem,
  getMenuItemsByRestaurantId
};
