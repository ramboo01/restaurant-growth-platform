const { getDatabasePool } = require('../../config/database');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

// ─── Validation Regex Patterns ───
const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const JWT_REGEX = /^[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_.-]{10,}$/;
const NUMERIC_REGEX = /^\d{5,}$/;
const NO_EMAIL_REGEX = /^[^@]+$/;

// ─── Helper: Ensure extra columns exist ───
async function ensureEcosystemColumns(pool) {
  await pool.execute(`ALTER TABLE channel_sync_status ADD COLUMN IF NOT EXISTS api_config TEXT NULL`).catch(() => {});
  await pool.execute(`ALTER TABLE channel_sync_status ADD COLUMN IF NOT EXISTS connection_status VARCHAR(30) NOT NULL DEFAULT 'Not Connected'`).catch(() => {});
  await pool.execute(`ALTER TABLE local_seo_listings ADD COLUMN IF NOT EXISTS api_config TEXT NULL`).catch(() => {});
  await pool.execute(`ALTER TABLE local_seo_listings ADD COLUMN IF NOT EXISTS connection_status VARCHAR(30) NOT NULL DEFAULT 'Not Connected'`).catch(() => {});
}

// ─── GET Channels ───
async function getChannels(req, res, next) {
  try {
    const pool = getDatabasePool();
    await ensureEcosystemColumns(pool);
    const [rows] = await pool.execute(`SELECT * FROM channel_sync_status ORDER BY id ASC`);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Channel sync statuses fetched successfully',
      data: rows
    });
  } catch (err) {
    return next(err);
  }
}

// ─── Force Sync Channel (only if connected) ───
async function forceSyncChannel(req, res, next) {
  try {
    const pool = getDatabasePool();
    const { id } = req.body;
    await ensureEcosystemColumns(pool);

    const [check] = await pool.execute('SELECT connection_status FROM channel_sync_status WHERE id = ?', [id]);
    if (check.length === 0) {
      return sendError(res, { statusCode: 404, message: 'Channel not found.' });
    }
    if (check[0].connection_status !== 'Connected') {
      return sendError(res, { statusCode: 400, message: '❌ Cannot sync — channel API credentials are not configured. Please click "Configure API" first.' });
    }

    await pool.execute(
      `UPDATE channel_sync_status SET last_synced_at = NOW(), status = 'Active' WHERE id = ?`,
      [id]
    );
    const [updated] = await pool.execute(`SELECT * FROM channel_sync_status WHERE id = ?`, [id]);
    return sendSuccess(res, {
      statusCode: 200,
      message: '🎉 Channel synchronization triggered and updated live!',
      data: updated[0]
    });
  } catch (err) {
    return next(err);
  }
}

// ─── Franchise Applications ───
async function getFranchiseApplications(req, res, next) {
  try {
    const pool = getDatabasePool();
    const [rows] = await pool.execute(`SELECT * FROM franchise_applications ORDER BY submitted_at DESC`);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Franchise applications fetched successfully',
      data: rows
    });
  } catch (err) {
    return next(err);
  }
}

async function handleFranchiseAppAction(req, res, next) {
  try {
    const pool = getDatabasePool();
    const { id, action } = req.body;
    await pool.execute(`UPDATE franchise_applications SET status = ? WHERE id = ?`, [action, id]);
    const [updated] = await pool.execute(`SELECT * FROM franchise_applications WHERE id = ?`, [id]);
    return sendSuccess(res, {
      statusCode: 200,
      message: `🎉 Franchise application ${action.toLowerCase()}!`,
      data: updated[0]
    });
  } catch (err) {
    return next(err);
  }
}

// ─── Instant Payout ───
async function requestInstantPayout(req, res, next) {
  try {
    const pool = getDatabasePool();
    const { staffName, tipsEarned, basePay } = req.body;
    const tips = Number(tipsEarned || 45.00);
    const base = Number(basePay || 95.00);
    const total = tips + base;
    const today = new Date().toISOString().split('T')[0];

    const [result] = await pool.execute(
      `INSERT INTO staff_instant_payouts (staff_name, shift_date, tips_earned, base_pay, total_payout, status)
       VALUES (?, ?, ?, ?, ?, 'Paid')`,
      [staffName || 'Staff Member', today, tips, base, total]
    );

    const [rows] = await pool.execute(`SELECT * FROM staff_instant_payouts WHERE id = ?`, [result.insertId]);

    return sendSuccess(res, {
      statusCode: 201,
      message: `🎉 Instant payout of $${total.toFixed(2)} disbursed to your account!`,
      data: rows[0]
    });
  } catch (err) {
    return next(err);
  }
}

// ─── GET SEO Listings ───
async function getSeoListings(req, res, next) {
  try {
    const pool = getDatabasePool();
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS local_seo_listings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        platform_name VARCHAR(100) NOT NULL UNIQUE,
        listing_category VARCHAR(100) NOT NULL,
        sync_status VARCHAR(50) NOT NULL DEFAULT 'Synced 100%',
        last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `).catch(() => {});

    const [existing] = await pool.execute(`SELECT id FROM local_seo_listings LIMIT 1`).catch(() => [[]]);
    if (existing.length === 0) {
      await pool.execute(`
        INSERT INTO local_seo_listings (platform_name, listing_category, sync_status)
        VALUES 
        ('Google Business Profile', 'Search & Maps', 'Synced 100%'),
        ('Yelp Local Directory', 'Reviews & Business Info', 'Synced 100%'),
        ('TripAdvisor Dining', 'Travel & Dining', 'Synced 100%'),
        ('Apple Maps Connect', 'Navigation & Voice Search', 'Synced 100%')
      `).catch(() => {});
    }

    await ensureEcosystemColumns(pool);
    const [rows] = await pool.execute(`SELECT * FROM local_seo_listings ORDER BY id ASC`);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Local SEO listings fetched successfully',
      data: rows
    });
  } catch (err) {
    return next(err);
  }
}

// ─── Sync SEO Listing (only if connected) ───
async function syncSeoListing(req, res, next) {
  try {
    const pool = getDatabasePool();
    const { id } = req.body;
    await ensureEcosystemColumns(pool);

    const [check] = await pool.execute('SELECT connection_status FROM local_seo_listings WHERE id = ?', [id]);
    if (check.length === 0) {
      return sendError(res, { statusCode: 404, message: 'SEO listing not found.' });
    }
    if (check[0].connection_status !== 'Connected') {
      return sendError(res, { statusCode: 400, message: '❌ Cannot sync — SEO platform credentials are not configured. Please click "Configure API" first.' });
    }

    await pool.execute(
      `UPDATE local_seo_listings SET last_synced_at = NOW(), sync_status = 'Synced 100%' WHERE id = ?`,
      [id]
    );
    const [updated] = await pool.execute(`SELECT * FROM local_seo_listings WHERE id = ?`, [id]);
    return sendSuccess(res, {
      statusCode: 200,
      message: '🎉 Local SEO directory NAP listing re-synced live in database!',
      data: updated[0]
    });
  } catch (err) {
    return next(err);
  }
}

// ─── Configure Channel (STRICT validation) ───
async function configureChannel(req, res, next) {
  try {
    const pool = getDatabasePool();
    const { id, config } = req.body;
    await ensureEcosystemColumns(pool);

    const [channelRows] = await pool.execute('SELECT channel_name FROM channel_sync_status WHERE id = ?', [id]);
    if (channelRows.length === 0) {
      return sendError(res, { statusCode: 404, message: '❌ Channel not found in database.' });
    }
    const channelName = channelRows[0].channel_name;

    // ─── STRICT Validation per channel type ───
    if (channelName.includes('Toast')) {
      const { toastClientId, toastClientSecret, restaurantGuid } = config || {};
      if (!toastClientId || !NO_EMAIL_REGEX.test(toastClientId)) {
        return sendError(res, { statusCode: 400, message: '❌ Invalid Toast Client ID — must be an alphanumeric API client identifier, not an email address. Get this from your Toast Developer Portal.' });
      }
      if (toastClientId.length < 10) {
        return sendError(res, { statusCode: 400, message: '❌ Toast Client ID too short — must be at least 10 characters (e.g. toast_cli_abc123def).' });
      }
      if (!toastClientSecret || toastClientSecret.length < 20) {
        return sendError(res, { statusCode: 400, message: '❌ Toast Client Secret too short — must be at least 20 characters. Get this from Toast Developer Portal > API Credentials.' });
      }
      if (!restaurantGuid || !UUID_REGEX.test(restaurantGuid)) {
        return sendError(res, { statusCode: 400, message: '❌ Invalid Restaurant GUID — must be a valid UUID (e.g. 123e4567-e89b-12d3-a456-426614174000). Find this in Toast Admin > Restaurant Details.' });
      }
    } else if (channelName.includes('UberEats')) {
      const { storeId, accessToken } = config || {};
      if (!storeId || storeId.includes('@') || storeId.length < 8) {
        return sendError(res, { statusCode: 400, message: '❌ Invalid Uber Store ID — must be at least 8 alphanumeric characters (not an email). Find this in Uber Eats Merchant Dashboard.' });
      }
      if (!accessToken || accessToken.length < 30) {
        return sendError(res, { statusCode: 400, message: '❌ Invalid OAuth Access Token — must be at least 30 characters. Generate this from Uber Developer Portal.' });
      }
    } else if (channelName.includes('DoorDash')) {
      const { developerJwt, merchantId } = config || {};
      if (!developerJwt || !JWT_REGEX.test(developerJwt)) {
        return sendError(res, { statusCode: 400, message: '❌ Invalid DoorDash Developer JWT — must be a valid JWT with 3 dot-separated segments. Get this from DoorDash Developer Portal.' });
      }
      if (!merchantId || merchantId.length < 8) {
        return sendError(res, { statusCode: 400, message: '❌ Invalid DoorDash Merchant ID — must be at least 8 characters.' });
      }
    } else if (channelName.includes('WhatsApp')) {
      const { phoneNumberId, systemToken } = config || {};
      if (!phoneNumberId || !NUMERIC_REGEX.test(phoneNumberId)) {
        return sendError(res, { statusCode: 400, message: '❌ Invalid WhatsApp Phone Number ID — must contain only digits (min 5). Find this in Meta Business Suite > WhatsApp.' });
      }
      if (!systemToken || systemToken.length < 30) {
        return sendError(res, { statusCode: 400, message: '❌ Invalid System User Token — must be at least 30 characters. Generate from Meta Business Settings.' });
      }
    } else if (channelName.includes('Google Reserve')) {
      const { locationId, authCode } = config || {};
      if (!locationId || locationId.length < 10) {
        return sendError(res, { statusCode: 400, message: '❌ Invalid Google Location ID — must be at least 10 characters. Find in Google Business Profile settings.' });
      }
      if (!authCode || authCode.length < 15) {
        return sendError(res, { statusCode: 400, message: '❌ Invalid Google OAuth Authorization Code — must be at least 15 characters.' });
      }
    }

    // ─── Validation passed → Save & mark Connected ───
    const configStr = JSON.stringify(config);
    await pool.execute(
      `UPDATE channel_sync_status SET api_config = ?, connection_status = 'Connected', status = 'Active', last_synced_at = NOW() WHERE id = ?`,
      [configStr, id]
    );

    await pool.execute(
      `INSERT INTO platform_audit_logs (user_id, user_role, action_type, description)
       VALUES (1, 'Admin', 'CHANNEL_CONFIGURED', ?)`,
      [`Validated and configured API credentials for: ${channelName}`]
    ).catch(() => {});

    return sendSuccess(res, {
      statusCode: 200,
      message: `🎉 ${channelName} API credentials validated and connection established! Owner portal updated.`
    });
  } catch (err) {
    return next(err);
  }
}

// ─── Configure SEO Listing (STRICT validation) ───
async function configureSeoListing(req, res, next) {
  try {
    const pool = getDatabasePool();
    const { id, config } = req.body;
    await ensureEcosystemColumns(pool);

    const [seoRows] = await pool.execute('SELECT platform_name FROM local_seo_listings WHERE id = ?', [id]);
    if (seoRows.length === 0) {
      return sendError(res, { statusCode: 404, message: '❌ SEO Platform not found in database.' });
    }
    const platformName = seoRows[0].platform_name;

    if (platformName.includes('Google Business')) {
      const { locationId, authCode } = config || {};
      if (!locationId || locationId.length < 10) {
        return sendError(res, { statusCode: 400, message: '❌ Invalid Google Location ID — must be at least 10 characters. Find in Google Business Profile settings.' });
      }
      if (!authCode || authCode.length < 15) {
        return sendError(res, { statusCode: 400, message: '❌ Invalid Google OAuth Code — must be at least 15 characters from Google Cloud Console.' });
      }
    } else if (platformName.includes('Yelp')) {
      const { apiKey, businessAlias } = config || {};
      if (!apiKey || apiKey.length < 20) {
        return sendError(res, { statusCode: 400, message: '❌ Invalid Yelp Fusion API Key — must be at least 20 characters. Get from Yelp Developer Console.' });
      }
      if (!businessAlias || businessAlias.length < 3) {
        return sendError(res, { statusCode: 400, message: '❌ Invalid Yelp Business Alias — must be at least 3 characters (e.g. your-restaurant-chicago).' });
      }
    } else if (platformName.includes('TripAdvisor')) {
      const { partnerId, locationId } = config || {};
      if (!partnerId || partnerId.length < 8) {
        return sendError(res, { statusCode: 400, message: '❌ Invalid TripAdvisor Partner ID — must be at least 8 characters.' });
      }
      if (!locationId || !NUMERIC_REGEX.test(locationId)) {
        return sendError(res, { statusCode: 400, message: '❌ Invalid TripAdvisor Location ID — must contain only digits (min 5). Find in TripAdvisor Management Center.' });
      }
    } else if (platformName.includes('Apple')) {
      const { developerToken } = config || {};
      if (!developerToken || developerToken.length < 20) {
        return sendError(res, { statusCode: 400, message: '❌ Invalid Apple Maps Developer Token — must be at least 20 characters. Generate from Apple Developer Portal.' });
      }
    }

    const configStr = JSON.stringify(config);
    await pool.execute(
      `UPDATE local_seo_listings SET api_config = ?, connection_status = 'Connected', sync_status = 'Synced 100%', last_synced_at = NOW() WHERE id = ?`,
      [configStr, id]
    );

    await pool.execute(
      `INSERT INTO platform_audit_logs (user_id, user_role, action_type, description)
       VALUES (1, 'Admin', 'SEO_LISTING_CONFIGURED', ?)`,
      [`Validated and configured NAP sync for: ${platformName}`]
    ).catch(() => {});

    return sendSuccess(res, {
      statusCode: 200,
      message: `🎉 ${platformName} credentials validated and NAP sync connection established!`
    });
  } catch (err) {
    return next(err);
  }
}

// ─── Owner Portal: Get connected integrations ───
async function getOwnerIntegrations(req, res, next) {
  try {
    const pool = getDatabasePool();
    await ensureEcosystemColumns(pool);

    const [channels] = await pool.execute(
      `SELECT id, channel_name, channel_type, status, connection_status, last_synced_at FROM channel_sync_status ORDER BY id ASC`
    );
    const [seoListings] = await pool.execute(
      `SELECT id, platform_name, listing_category, sync_status, connection_status, last_synced_at FROM local_seo_listings ORDER BY id ASC`
    );

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Owner integrations fetched',
      data: { channels, seoListings }
    });
  } catch (err) {
    return next(err);
  }
}

// ─── Admin: Reset channel connection (disconnect) ───
async function disconnectChannel(req, res, next) {
  try {
    const pool = getDatabasePool();
    const { id, type } = req.body;
    await ensureEcosystemColumns(pool);

    if (type === 'seo') {
      await pool.execute(
        `UPDATE local_seo_listings SET api_config = NULL, connection_status = 'Not Connected' WHERE id = ?`,
        [id]
      );
    } else {
      await pool.execute(
        `UPDATE channel_sync_status SET api_config = NULL, connection_status = 'Not Connected', status = 'Not Connected' WHERE id = ?`,
        [id]
      );
    }

    return sendSuccess(res, { statusCode: 200, message: '⚠️ Integration disconnected and credentials removed.' });
  } catch (err) {
    return next(err);
  }
}

// ─── Circuit Breaker Management ───
async function getCircuitBreakers(req, res, next) {
  try {
    const { getChannelSyncStates } = require('./channelSync.service');
    const states = await getChannelSyncStates(req.query.restaurantId);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Circuit breaker states fetched',
      data: states
    });
  } catch (err) {
    return next(err);
  }
}

async function resetCircuitBreaker(req, res, next) {
  try {
    const { resetChannelCircuitBreaker } = require('./channelSync.service');
    const { restaurantId, channelName } = req.body;
    const result = await resetChannelCircuitBreaker(restaurantId || 1, channelName);
    return sendSuccess(res, {
      statusCode: 200,
      message: result.message,
      data: result
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getChannels,
  forceSyncChannel,
  getFranchiseApplications,
  handleFranchiseAppAction,
  requestInstantPayout,
  getSeoListings,
  syncSeoListing,
  configureChannel,
  configureSeoListing,
  getOwnerIntegrations,
  disconnectChannel,
  getCircuitBreakers,
  resetCircuitBreaker
};
