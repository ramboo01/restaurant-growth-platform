const { getDatabasePool } = require('../../config/database');

/**
 * Get all restaurants accessible by a user
 */
async function getRestaurantsForUser(userId) {
  const pool = getDatabasePool();

  if (userId) {
    // Auto-link any restaurants created without user_restaurants record
    const [unlinked] = await pool.execute(
      `SELECT r.id FROM restaurants r 
       LEFT JOIN user_restaurants ur ON r.id = ur.restaurant_id AND ur.user_id = ? 
       WHERE ur.id IS NULL`,
      [userId]
    );
    for (const u of unlinked) {
      await pool.execute(
        `INSERT IGNORE INTO user_restaurants (user_id, restaurant_id, role, is_primary) VALUES (?, ?, 'Owner', 0)`,
        [userId, u.id]
      );
    }
  }

  const [rows] = await pool.execute(
    `SELECT r.id, r.name, r.phone, r.email, r.address, r.cuisine,
            r.opening_time AS openingTime, r.closing_time AS closingTime,
            r.status, r.created_at AS createdAt,
            ur.is_primary AS isPrimary, ur.role AS accessRole
     FROM user_restaurants ur
     JOIN restaurants r ON ur.restaurant_id = r.id
     WHERE ur.user_id = ?
     ORDER BY ur.is_primary DESC, r.name ASC`,
    [userId]
  );
  return rows;
}

/**
 * Check if a user has access to a specific restaurant
 */
async function userHasAccessToRestaurant(userId, restaurantId) {
  const pool = getDatabasePool();
  const [rows] = await pool.execute(
    `SELECT id FROM user_restaurants WHERE user_id = ? AND restaurant_id = ?`,
    [userId, restaurantId]
  );
  return rows.length > 0;
}

/**
 * Grant a user access to a restaurant
 */
async function grantAccess(userId, restaurantId, role = 'Owner', isPrimary = false) {
  const pool = getDatabasePool();
  await pool.execute(
    `INSERT INTO user_restaurants (user_id, restaurant_id, role, is_primary) 
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE role = VALUES(role)`,
    [userId, restaurantId, role, isPrimary]
  );
}

/**
 * Update restaurant status (Active, Inactive, Suspended)
 */
async function updateRestaurantStatus(restaurantId, status) {
  const pool = getDatabasePool();
  const allowed = ['Active', 'Inactive', 'Suspended'];
  if (!allowed.includes(status)) {
    throw new Error(`Invalid status: ${status}. Must be one of: ${allowed.join(', ')}`);
  }
  await pool.execute(
    `UPDATE restaurants SET status = ? WHERE id = ?`,
    [status, restaurantId]
  );
}

/**
 * Get franchise settings for an owner
 */
async function getFranchiseSettings(ownerUserId) {
  const pool = getDatabasePool();
  const [rows] = await pool.execute(
    `SELECT pricing_sync AS pricingSync, require_approval AS requireApproval, audit_logs AS auditLogs
     FROM franchise_settings WHERE owner_user_id = ?`,
    [ownerUserId]
  );
  return rows[0] || { pricingSync: true, requireApproval: false, auditLogs: true };
}

/**
 * Save franchise settings for an owner
 */
async function saveFranchiseSettings(ownerUserId, settings) {
  const pool = getDatabasePool();
  await pool.execute(
    `INSERT INTO franchise_settings (owner_user_id, pricing_sync, require_approval, audit_logs)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE pricing_sync = VALUES(pricing_sync), require_approval = VALUES(require_approval), audit_logs = VALUES(audit_logs)`,
    [ownerUserId, settings.pricingSync ? 1 : 0, settings.requireApproval ? 1 : 0, settings.auditLogs ? 1 : 0]
  );
  return getFranchiseSettings(ownerUserId);
}

/**
 * Sync menu from source restaurant to ALL other restaurants owned by a user
 */
async function syncMenuAcrossRestaurants(userId, sourceRestaurantId) {
  const pool = getDatabasePool();

  // Get all restaurants this user has access to (except source)
  const targetRestaurants = await getRestaurantsForUser(userId);
  const targets = targetRestaurants.filter(r => r.id !== Number(sourceRestaurantId));

  if (targets.length === 0) {
    return { syncedTo: 0, message: 'No other restaurants found to sync.' };
  }

  // Get all menu items from source
  const [sourceItems] = await pool.execute(
    `SELECT name, description, price, category_id, image_url, is_available 
     FROM menu_items WHERE restaurant_id = ?`,
    [sourceRestaurantId]
  );

  if (sourceItems.length === 0) {
    return { syncedTo: 0, message: 'Source restaurant has no menu items to sync.' };
  }

  // Get source categories
  const [sourceCategories] = await pool.execute(
    `SELECT id, name FROM menu_categories WHERE restaurant_id = ?`,
    [sourceRestaurantId]
  );

  let totalSynced = 0;

  for (const target of targets) {
    // Map source categories to target categories (create if not exist)
    const categoryMap = {};
    for (const srcCat of sourceCategories) {
      const [existingCat] = await pool.execute(
        `SELECT id FROM menu_categories WHERE restaurant_id = ? AND name = ?`,
        [target.id, srcCat.name]
      );
      if (existingCat.length > 0) {
        categoryMap[srcCat.id] = existingCat[0].id;
      } else {
        const [newCat] = await pool.execute(
          `INSERT INTO menu_categories (restaurant_id, name) VALUES (?, ?)`,
          [target.id, srcCat.name]
        );
        categoryMap[srcCat.id] = newCat.insertId;
      }
    }

    // Sync menu items (upsert by name)
    for (const item of sourceItems) {
      const targetCategoryId = categoryMap[item.category_id] || null;
      const [existing] = await pool.execute(
        `SELECT id FROM menu_items WHERE restaurant_id = ? AND name = ?`,
        [target.id, item.name]
      );

      if (existing.length > 0) {
        // Update existing
        await pool.execute(
          `UPDATE menu_items SET description = ?, price = ?, category_id = ?, image_url = ?, is_available = ?
           WHERE id = ?`,
          [item.description, item.price, targetCategoryId, item.image_url, item.is_available, existing[0].id]
        );
      } else {
        // Insert new
        await pool.execute(
          `INSERT INTO menu_items (restaurant_id, name, description, price, category_id, image_url, is_available)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [target.id, item.name, item.description, item.price, targetCategoryId, item.image_url, item.is_available]
        );
      }
    }
    totalSynced++;
  }

  return {
    syncedTo: totalSynced,
    itemCount: sourceItems.length,
    message: `Successfully synced ${sourceItems.length} menu items to ${totalSynced} restaurant(s).`
  };
}

/**
 * Get financial settings for a restaurant
 */
async function getFinancialSettings(restaurantId) {
  const pool = getDatabasePool();
  const [rows] = await pool.execute(
    `SELECT allow_installments AS allowInstallments, deposit_pct AS depositPct, 
            is_subsidized AS isSubsidized, instant_pay_fee AS instantPayFee
     FROM financial_settings WHERE restaurant_id = ?`,
    [restaurantId]
  );
  
  if (rows.length === 0) {
    return {
      allowInstallments: true,
      depositPct: 25,
      isSubsidized: false,
      instantPayFee: 1.99
    };
  }
  
  return {
    allowInstallments: Boolean(rows[0].allowInstallments),
    depositPct: Number(rows[0].depositPct),
    isSubsidized: Boolean(rows[0].isSubsidized),
    instantPayFee: Number(rows[0].instantPayFee)
  };
}

/**
 * Save financial settings for a restaurant
 */
async function saveFinancialSettings(restaurantId, settings) {
  const pool = getDatabasePool();
  await pool.execute(
    `INSERT INTO financial_settings (restaurant_id, allow_installments, deposit_pct, is_subsidized, instant_pay_fee)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE 
       allow_installments = VALUES(allow_installments), 
       deposit_pct = VALUES(deposit_pct), 
       is_subsidized = VALUES(is_subsidized), 
       instant_pay_fee = VALUES(instant_pay_fee)`,
    [
      restaurantId,
      settings.allowInstallments ? 1 : 0,
      Number(settings.depositPct),
      settings.isSubsidized ? 1 : 0,
      Number(settings.instantPayFee)
    ]
  );
  return getFinancialSettings(restaurantId);
}

/**
 * Get active catering installments for a restaurant
 */
async function getCateringInstallments(restaurantId) {
  const pool = getDatabasePool();
  const [rows] = await pool.execute(
    `SELECT * FROM catering_installments WHERE restaurant_id = ? ORDER BY id DESC`,
    [restaurantId]
  );
  return rows.map(r => ({
    rawId: r.id,
    id: `CAT-${String(r.id).padStart(4, '0')}`,
    guest: r.guest_name,
    event: r.event_name,
    companyName: r.company_name,
    contactPerson: r.contact_person,
    contactPhone: r.contact_phone,
    contactEmail: r.contact_email,
    eventDate: r.event_date,
    eventTime: r.event_time,
    venueAddress: r.venue_address,
    headcount: r.headcount,
    packageTier: r.package_tier,
    dietaryNotes: r.dietary_notes,
    paymentPlan: r.payment_plan,
    totalNum: Number(r.total_amount),
    depositNum: Number(r.deposit_amount),
    paidNum: Number(r.paid_amount),
    total: `$${Number(r.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    deposit: `$${Number(r.deposit_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    paid: `$${Number(r.paid_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    status: r.status,
    createdAt: r.created_at
  }));
}

async function getFranchiseComparisonData(userId) {
  const pool = getDatabasePool();
  const restaurants = await getRestaurantsForUser(userId);
  
  const comparisonData = [];
  let combinedSales = 0;
  let totalLaborPctSum = 0;
  let totalAuditScoreSum = 0;
  
  for (const r of restaurants) {
    // 1. Get live sales for the current month
    const [salesRow] = await pool.execute(
      `SELECT COALESCE(SUM(total_amount), 0) as monthlySales 
       FROM orders 
       WHERE restaurant_id = ? AND created_at >= DATE_FORMAT(NOW() ,'%Y-%m-01')`,
      [r.id]
    );
    // Add seed fallback so that demo looks populated, but responds to new orders
    const liveSales = Number(salesRow[0]?.monthlySales || 0);
    const demoSeedSales = 15000 + (r.id * 7500); // stable baseline sales
    const finalSales = liveSales > 0 ? liveSales + demoSeedSales : demoSeedSales;

    // 2. Get compliance scores from franchise_compliance table
    const [compRows] = await pool.execute(
      `SELECT food_safety_score, brand_standard_score, speed_score, review_score, audit_status 
       FROM franchise_compliance 
       WHERE restaurant_id = ?`,
      [r.id]
    );

    let comp = compRows[0];
    if (!comp) {
      // Seed default compliance details if not in DB
      await pool.execute(
        `INSERT IGNORE INTO franchise_compliance 
         (restaurant_id, store_name, location_city, food_safety_score, brand_standard_score, speed_score, review_score, audit_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [r.id, r.name, r.address?.split(',')[1]?.trim() || 'New York', 95 + (r.id % 4), 92 + (r.id % 5), 90 + (r.id % 6), 4.5 + (r.id % 5)*0.1, 'Compliant']
      );
      
      const [newComp] = await pool.execute(
        `SELECT food_safety_score, brand_standard_score, speed_score, review_score, audit_status 
         FROM franchise_compliance 
         WHERE restaurant_id = ?`,
        [r.id]
      );
      comp = newComp[0];
    }

    const auditScoreNum = Math.round((Number(comp.food_safety_score) + Number(comp.brand_standard_score) + Number(comp.speed_score)) / 3);
    
    // Stable but distinct costs for demo
    const laborCostPct = 25 + (r.id * 1.7) % 8;
    const foodCostPct = 28 + (r.id * 1.3) % 7;
    
    let status = 'Optimal';
    if (auditScoreNum >= 95 && laborCostPct < 28) {
      status = 'Top Performer';
    } else if (laborCostPct > 30 || auditScoreNum < 90) {
      status = 'Cost Warning';
    }

    combinedSales += finalSales;
    totalLaborPctSum += laborCostPct;
    totalAuditScoreSum += auditScoreNum;

    comparisonData.push({
      id: r.id,
      name: r.name,
      sales: finalSales,
      laborCost: `${laborCostPct.toFixed(1)}%`,
      foodCost: `${foodCostPct.toFixed(1)}%`,
      auditScore: `${auditScoreNum}%`,
      status
    });
  }

  const avgLaborCost = restaurants.length > 0 ? (totalLaborPctSum / restaurants.length).toFixed(1) : '28.5';
  const avgAuditScore = restaurants.length > 0 ? (totalAuditScoreSum / restaurants.length).toFixed(1) : '94.0';

  return {
    stores: comparisonData,
    summary: {
      combinedSales,
      avgLaborCost: `${avgLaborCost}%`,
      avgAuditScore: `${avgAuditScore}%`
    }
  };
}

module.exports = {
  getRestaurantsForUser,
  userHasAccessToRestaurant,
  grantAccess,
  updateRestaurantStatus,
  getFranchiseSettings,
  saveFranchiseSettings,
  syncMenuAcrossRestaurants,
  getFinancialSettings,
  saveFinancialSettings,
  getCateringInstallments,
  getFranchiseComparisonData
};
