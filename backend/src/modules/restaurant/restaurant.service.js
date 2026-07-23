const { getDatabasePool } = require('../../config/database');

async function createRestaurant(payload) {
  const [result] = await getDatabasePool().execute(
    `INSERT INTO restaurants (name, phone, email, address, cuisine, opening_time, closing_time)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.name.trim(),
      payload.phone.trim(),
      payload.email.trim().toLowerCase(),
      payload.address.trim(),
      payload.cuisine.trim(),
      payload.openingTime,
      payload.closingTime
    ]
  );

  return getRestaurantById(result.insertId);
}

async function getRestaurants() {
  const [rows] = await getDatabasePool().execute(
    `SELECT id, name, phone, email, address, cuisine, opening_time AS openingTime, closing_time AS closingTime, created_at AS createdAt
     FROM restaurants
     ORDER BY created_at DESC`
  );
  return rows;
}

async function getRestaurantById(id) {
  const [rows] = await getDatabasePool().execute(
    `SELECT id, name, phone, email, address, cuisine, opening_time AS openingTime, closing_time AS closingTime, created_at AS createdAt
     FROM restaurants
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] ?? null;
}

async function updateRestaurant(id, payload) {
  const [result] = await getDatabasePool().execute(
    `UPDATE restaurants
     SET name = ?, phone = ?, email = ?, address = ?, cuisine = ?, opening_time = ?, closing_time = ?
     WHERE id = ?`,
    [
      payload.name.trim(),
      payload.phone.trim(),
      payload.email.trim().toLowerCase(),
      payload.address.trim(),
      payload.cuisine.trim(),
      payload.openingTime,
      payload.closingTime,
      id
    ]
  );

  return result.affectedRows > 0 ? getRestaurantById(id) : null;
}

async function deleteRestaurant(id) {
  const [result] = await getDatabasePool().execute('DELETE FROM restaurants WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = {
  createRestaurant,
  getRestaurants,
  getRestaurantById,
  updateRestaurant,
  deleteRestaurant
};
