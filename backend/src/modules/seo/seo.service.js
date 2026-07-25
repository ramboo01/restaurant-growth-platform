const { getDatabasePool } = require('../../config/database');

async function getSeoSettings(restaurantId) {
  const pool = getDatabasePool();
  const [rows] = await pool.execute(
    `SELECT id, restaurant_id AS restaurantId, meta_title AS metaTitle, meta_description AS metaDescription, meta_keywords AS metaKeywords, structured_data_json AS structuredDataJson, sitemap_enabled AS sitemapEnabled, last_submitted_sitemap AS lastSubmittedSitemap 
     FROM seo_settings 
     WHERE restaurant_id = ?`,
    [restaurantId]
  );
  if (rows.length === 0) {
    return {
      restaurantId,
      metaTitle: '',
      metaDescription: '',
      metaKeywords: '',
      structuredDataJson: '{}',
      sitemapEnabled: true,
      lastSubmittedSitemap: null
    };
  }
  return rows[0];
}

async function updateSeoSettings(restaurantId, payload) {
  const pool = getDatabasePool();
  
  const [rows] = await pool.execute(
    'SELECT id FROM seo_settings WHERE restaurant_id = ?',
    [restaurantId]
  );

  if (rows.length === 0) {
    await pool.execute(
      `INSERT INTO seo_settings (restaurant_id, meta_title, meta_description, meta_keywords, structured_data_json, sitemap_enabled, last_submitted_sitemap)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        restaurantId,
        payload.metaTitle || '',
        payload.metaDescription || '',
        payload.metaKeywords || '',
        payload.structuredDataJson || '{}',
        payload.sitemapEnabled !== undefined ? payload.sitemapEnabled : true,
        payload.lastSubmittedSitemap || null
      ]
    );
  } else {
    await pool.execute(
      `UPDATE seo_settings 
       SET meta_title = ?, meta_description = ?, meta_keywords = ?, structured_data_json = ?, sitemap_enabled = ?, last_submitted_sitemap = ?
       WHERE restaurant_id = ?`,
      [
        payload.metaTitle || '',
        payload.metaDescription || '',
        payload.metaKeywords || '',
        payload.structuredDataJson || '{}',
        payload.sitemapEnabled !== undefined ? payload.sitemapEnabled : true,
        payload.lastSubmittedSitemap || null,
        restaurantId
      ]
    );
  }

  return getSeoSettings(restaurantId);
}

async function generateAiSeoMeta(restaurantId, businessDetails) {
  const name = businessDetails.name || 'Our Restaurant';
  const cuisine = businessDetails.cuisine || 'gourmet';
  const location = businessDetails.location || 'Local Area';

  const metaTitle = `Best ${cuisine} Food in ${location} | ${name} | Order Online`;
  const metaDescription = `Indulge in fresh, authentic ${cuisine} cuisine at ${name} in ${location}. Order online for quick local delivery, explore our menu, and earn loyalty rewards today!`;
  const metaKeywords = `${cuisine} food, ${name}, order ${cuisine} online, restaurant in ${location}`;
  
  return {
    metaTitle,
    metaDescription,
    metaKeywords
  };
}

module.exports = {
  getSeoSettings,
  updateSeoSettings,
  generateAiSeoMeta
};
