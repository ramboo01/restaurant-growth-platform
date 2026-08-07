const { getDatabasePool } = require('../../config/database');

async function createRestaurant(payload, userId) {
  const pool = getDatabasePool();
  const [result] = await pool.execute(
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

  const restaurantId = result.insertId;

  if (userId) {
    await pool.execute(
      `INSERT INTO user_restaurants (user_id, restaurant_id, role, is_primary)
       VALUES (?, ?, 'Owner', 0)
       ON DUPLICATE KEY UPDATE role = 'Owner'`,
      [userId, restaurantId]
    );
  }

  return getRestaurantById(restaurantId);
}

async function getRestaurants() {
  const [rows] = await getDatabasePool().execute(
    `SELECT 
        r.id, 
        r.name, 
        r.phone, 
        r.email, 
        r.address, 
        r.cuisine, 
        r.opening_time AS openingTime, 
        r.closing_time AS closingTime, 
        COALESCE(r.status, 'Active') AS status,
        r.created_at AS createdAt,
        (SELECT COUNT(*) FROM orders WHERE restaurant_id = r.id) AS orderCount,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE restaurant_id = r.id) AS totalRevenue
     FROM restaurants r
     ORDER BY r.id ASC`
  );
  return rows;
}

async function updateRestaurantStatus(id, status) {
  const pool = getDatabasePool();
  await pool.execute(
    `UPDATE restaurants SET status = ? WHERE id = ?`,
    [status, id]
  );
  return getRestaurantById(id);
}

async function getRestaurantById(id) {
  const pool = getDatabasePool();
  const [rows] = await pool.execute(
    `SELECT id, name, phone, email, address, cuisine, 
            opening_time AS openingTime, closing_time AS closingTime, created_at AS createdAt,
            COALESCE(status, 'Active') AS status,
            weekly_schedule AS weeklySchedule, gst, service_charge AS serviceCharge,
            cash, card, upi, wallet, primary_color AS primaryColor, secondary_color AS secondaryColor,
            email_notifications AS emailNotifications, sms_notifications AS smsNotifications, push_notifications AS pushNotifications,
            logo_url AS logoUrl, banner_url AS bannerUrl
     FROM restaurants
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  if (rows.length === 0) return null;
  const restaurant = rows[0];

  // Fetch delivery config
  const { getDeliveryConfig } = require('../delivery/delivery.service');
  const deliveryConfig = await getDeliveryConfig(id);

  return {
    ...restaurant,
    cash: Boolean(restaurant.cash),
    card: Boolean(restaurant.card),
    upi: Boolean(restaurant.upi),
    wallet: Boolean(restaurant.wallet),
    emailNotifications: Boolean(restaurant.emailNotifications),
    smsNotifications: Boolean(restaurant.smsNotifications),
    pushNotifications: Boolean(restaurant.pushNotifications),
    deliveryRadius: deliveryConfig.radiusLimit,
    minimumOrderAmount: deliveryConfig.minOrderValue,
    deliveryFee: deliveryConfig.baseDeliveryFee,
    freeDeliveryThreshold: deliveryConfig.freeDeliveryThreshold
  };
}

async function updateRestaurant(id, payload) {
  const pool = getDatabasePool();
  
  // 1. Update restaurants table
  await pool.execute(
    `UPDATE restaurants
     SET name = ?, phone = ?, email = ?, address = ?, cuisine = ?, 
         opening_time = ?, closing_time = ?, weekly_schedule = ?,
         gst = ?, service_charge = ?, cash = ?, card = ?, upi = ?, wallet = ?,
         primary_color = ?, secondary_color = ?, email_notifications = ?,
         sms_notifications = ?, push_notifications = ?, logo_url = ?, banner_url = ?
     WHERE id = ?`,
    [
      payload.name.trim(),
      payload.phone.trim(),
      payload.email.trim().toLowerCase(),
      payload.address.trim(),
      payload.cuisine.trim(),
      payload.openingTime,
      payload.closingTime,
      payload.weeklySchedule || 'Mon-Sun',
      payload.gst !== undefined ? Number(payload.gst) : 5.00,
      payload.serviceCharge !== undefined ? Number(payload.serviceCharge) : 10.00,
      payload.cash ? 1 : 0,
      payload.card ? 1 : 0,
      payload.upi ? 1 : 0,
      payload.wallet ? 1 : 0,
      payload.primaryColor || '#1f2933',
      payload.secondaryColor || '#d9973f',
      payload.emailNotifications ? 1 : 0,
      payload.smsNotifications ? 1 : 0,
      payload.pushNotifications ? 1 : 0,
      payload.logoUrl || null,
      payload.bannerUrl || null,
      id
    ]
  );

  // 2. Update delivery_configs table
  const { updateDeliveryConfig } = require('../delivery/delivery.service');
  await updateDeliveryConfig(id, {
    radiusLimit: payload.deliveryRadius !== undefined ? Number(payload.deliveryRadius) : undefined,
    minOrderValue: payload.minimumOrderAmount !== undefined ? Number(payload.minimumOrderAmount) : undefined,
    baseDeliveryFee: payload.deliveryFee !== undefined ? Number(payload.deliveryFee) : undefined,
    freeDeliveryThreshold: payload.freeDeliveryThreshold !== undefined ? Number(payload.freeDeliveryThreshold) : undefined
  });

  return getRestaurantById(id);
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
  updateRestaurantStatus,
  deleteRestaurant
};
