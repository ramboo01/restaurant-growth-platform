const { getDatabasePool } = require('../../config/database');

async function getSuppliersByRestaurantId(restaurantId) {
  const [rows] = await getDatabasePool().execute(
    'SELECT * FROM suppliers WHERE restaurant_id = ? ORDER BY created_at DESC',
    [restaurantId]
  );
  return rows;
}

async function createSupplier(restaurantId, supplierData) {
  const { name, category, contact_person, phone, email, delivery_days, status } = supplierData;
  const [result] = await getDatabasePool().execute(
    'INSERT INTO suppliers (restaurant_id, name, category, contact_person, phone, email, delivery_days, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [restaurantId, name, category, contact_person, phone, email, delivery_days, status || 'Active']
  );
  return { id: result.insertId, ...supplierData, restaurant_id: restaurantId, status: status || 'Active' };
}

async function updateSupplier(restaurantId, supplierId, supplierData) {
  const { name, category, contact_person, phone, email, delivery_days, status } = supplierData;
  await getDatabasePool().execute(
    'UPDATE suppliers SET name = ?, category = ?, contact_person = ?, phone = ?, email = ?, delivery_days = ?, status = ? WHERE id = ? AND restaurant_id = ?',
    [name, category, contact_person, phone, email, delivery_days, status, supplierId, restaurantId]
  );
  return { id: supplierId, ...supplierData, restaurant_id: restaurantId };
}

async function deleteSupplier(restaurantId, supplierId) {
  await getDatabasePool().execute(
    'DELETE FROM suppliers WHERE id = ? AND restaurant_id = ?',
    [supplierId, restaurantId]
  );
}

module.exports = {
  getSuppliersByRestaurantId,
  createSupplier,
  updateSupplier,
  deleteSupplier
};
