const { getDatabasePool } = require('../../config/database');

async function getDeliveryConfig(restaurantId = 1) {
  const pool = getDatabasePool();
  const [rows] = await pool.execute(
    `SELECT id, restaurant_id AS restaurantId, radius_limit AS radiusLimit, base_delivery_fee AS baseDeliveryFee, min_order_value AS minOrderValue, free_delivery_threshold AS freeDeliveryThreshold, is_surge_active AS isSurgeActive, surge_multiplier AS surgeMultiplier, priority_json AS priorityJson, updated_at AS updatedAt 
     FROM delivery_configs 
     WHERE restaurant_id = ?`,
    [restaurantId]
  );

  if (rows.length === 0) {
    const doordashConnected = Boolean(process.env.DOORDASH_DEVELOPER_KEY);
    const uberConnected = Boolean(process.env.UBER_DIRECT_CLIENT_ID);
    return {
      restaurantId,
      radiusLimit: 5.5,
      baseDeliveryFee: 3.99,
      minOrderValue: 15.00,
      freeDeliveryThreshold: 50.00,
      isSurgeActive: false,
      surgeMultiplier: 1.50,
      priority: ['Owned Couriers', 'DoorDash Drive', 'Uber Direct'],
      partners: {
        doordash: {
          connected: doordashConnected,
          status: doordashConnected ? 'Connected' : 'Simulation Mode'
        },
        uber: {
          connected: uberConnected,
          status: uberConnected ? 'Connected' : 'Simulation Mode'
        }
      }
    };
  }

  const row = rows[0];
  let priority = ['Owned Couriers', 'DoorDash Drive', 'Uber Direct'];
  try {
    if (row.priorityJson) {
      priority = JSON.parse(row.priorityJson);
    }
  } catch (err) {
    priority = ['Owned Couriers', 'DoorDash Drive', 'Uber Direct'];
  }

  const doordashConnected = Boolean(process.env.DOORDASH_DEVELOPER_KEY);
  const uberConnected = Boolean(process.env.UBER_DIRECT_CLIENT_ID);

  return {
    ...row,
    radiusLimit: Number(row.radiusLimit),
    baseDeliveryFee: Number(row.baseDeliveryFee),
    minOrderValue: Number(row.minOrderValue),
    freeDeliveryThreshold: Number(row.freeDeliveryThreshold),
    isSurgeActive: Boolean(row.isSurgeActive),
    surgeMultiplier: Number(row.surgeMultiplier),
    priority,
    partners: {
      doordash: {
        connected: doordashConnected,
        status: doordashConnected ? 'Connected' : 'Simulation Mode'
      },
      uber: {
        connected: uberConnected,
        status: uberConnected ? 'Connected' : 'Simulation Mode'
      }
    }
  };
}

async function updateDeliveryConfig(restaurantId = 1, payload) {
  const pool = getDatabasePool();
  const existing = await getDeliveryConfig(restaurantId);

  const radiusLimit = payload.radiusLimit !== undefined ? payload.radiusLimit : existing.radiusLimit;
  const baseDeliveryFee = payload.baseDeliveryFee !== undefined ? payload.baseDeliveryFee : existing.baseDeliveryFee;
  const minOrderValue = payload.minOrderValue !== undefined ? payload.minOrderValue : existing.minOrderValue;
  const freeDeliveryThreshold = payload.freeDeliveryThreshold !== undefined ? payload.freeDeliveryThreshold : existing.freeDeliveryThreshold;
  const isSurgeActive = payload.isSurgeActive !== undefined ? payload.isSurgeActive : existing.isSurgeActive;
  const surgeMultiplier = payload.surgeMultiplier !== undefined ? payload.surgeMultiplier : existing.surgeMultiplier;
  const priorityJson = payload.priority ? JSON.stringify(payload.priority) : JSON.stringify(existing.priority);

  const [rows] = await pool.execute(
    'SELECT id FROM delivery_configs WHERE restaurant_id = ?',
    [restaurantId]
  );

  if (rows.length === 0) {
    await pool.execute(
      `INSERT INTO delivery_configs (restaurant_id, radius_limit, base_delivery_fee, min_order_value, free_delivery_threshold, is_surge_active, surge_multiplier, priority_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [restaurantId, radiusLimit, baseDeliveryFee, minOrderValue, freeDeliveryThreshold, isSurgeActive, surgeMultiplier, priorityJson]
    );
  } else {
    await pool.execute(
      `UPDATE delivery_configs 
       SET radius_limit = ?, base_delivery_fee = ?, min_order_value = ?, free_delivery_threshold = ?, is_surge_active = ?, surge_multiplier = ?, priority_json = ?
       WHERE restaurant_id = ?`,
      [radiusLimit, baseDeliveryFee, minOrderValue, freeDeliveryThreshold, isSurgeActive, surgeMultiplier, priorityJson, restaurantId]
    );
  }

  return getDeliveryConfig(restaurantId);
}

module.exports = {
  getDeliveryConfig,
  updateDeliveryConfig
};
