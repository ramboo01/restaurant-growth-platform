const { getDatabasePool } = require('../../config/database');

async function createCategory(payload) {
  const [result] = await getDatabasePool().execute(
    `INSERT INTO menu_categories (restaurant_id, name, display_order)
     VALUES (?, ?, ?)`,
    [
      payload.restaurantId,
      payload.name.trim(),
      payload.displayOrder === undefined || payload.displayOrder === null || payload.displayOrder === ''
        ? 0
        : payload.displayOrder
    ]
  );

  return getCategoryById(result.insertId);
}

async function getCategories() {
  const [rows] = await getDatabasePool().execute(
    `SELECT id, restaurant_id AS restaurantId, name, display_order AS displayOrder, created_at AS createdAt
     FROM menu_categories
     ORDER BY display_order ASC, created_at DESC`
  );
  return rows;
}

async function getCategoryById(id) {
  const [rows] = await getDatabasePool().execute(
    `SELECT id, restaurant_id AS restaurantId, name, display_order AS displayOrder, created_at AS createdAt
     FROM menu_categories
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

async function updateCategory(id, payload) {
  const [result] = await getDatabasePool().execute(
    `UPDATE menu_categories
     SET restaurant_id = ?, name = ?, display_order = ?
     WHERE id = ?`,
    [
      payload.restaurantId,
      payload.name.trim(),
      payload.displayOrder === undefined || payload.displayOrder === null || payload.displayOrder === ''
        ? 0
        : payload.displayOrder,
      id
    ]
  );

  return result.affectedRows > 0 ? getCategoryById(id) : null;
}

async function deleteCategory(id) {
  const [result] = await getDatabasePool().execute('DELETE FROM menu_categories WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

async function getCategoriesByRestaurantId(restaurantId) {
  const [rows] = await getDatabasePool().execute(
    `SELECT id, restaurant_id AS restaurantId, name, display_order AS displayOrder, created_at AS createdAt
     FROM menu_categories
     WHERE restaurant_id = ?
     ORDER BY display_order ASC, created_at DESC`,
    [restaurantId]
  );
  return rows;
}

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getCategoriesByRestaurantId
};
