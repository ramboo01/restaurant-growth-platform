const { getDatabasePool } = require('../../config/database');

async function getSeoSettings(restaurantId) {
  const pool = getDatabasePool();
  try {
    const [rows] = await pool.execute(
      `SELECT id, restaurant_id AS restaurantId, meta_title AS metaTitle, meta_description AS metaDescription, meta_keywords AS metaKeywords, structured_data_json AS structuredDataJson, sitemap_enabled AS sitemapEnabled, last_submitted_sitemap AS lastSubmittedSitemap 
       FROM seo_settings 
       WHERE restaurant_id = ?`,
      [restaurantId]
    );
    if (rows.length === 0) {
      return {
        restaurantId,
        metaTitle: 'Best Italian Pizza & Pasta in Town | RestruRent',
        metaDescription: 'Taste authentic stone-baked Italian pizza and artisan fresh pasta made from organic local ingredients. Order online now for fast contact-free delivery.',
        metaKeywords: 'italian food, pizza delivery, pasta near me, best italian restaurant',
        structuredDataJson: '{"@context":"https://schema.org","@type":"Restaurant","name":"RestruRent","image":"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4","priceRange":"$$"}',
        sitemapEnabled: true,
        lastSubmittedSitemap: null
      };
    }
    return rows[0];
  } catch (err) {
    console.warn('[SEO] Failed to fetch seo_settings, using fallback defaults:', err.message);
    return {
      restaurantId,
      metaTitle: 'Best Italian Pizza & Pasta in Town | RestruRent',
      metaDescription: 'Taste authentic stone-baked Italian pizza and artisan fresh pasta made from organic local ingredients. Order online now for fast contact-free delivery.',
      metaKeywords: 'italian food, pizza delivery, pasta near me, best italian restaurant',
      structuredDataJson: '{"@context":"https://schema.org","@type":"Restaurant","name":"RestruRent","image":"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4","priceRange":"$$"}',
      sitemapEnabled: true,
      lastSubmittedSitemap: null
    };
  }
}

async function updateSeoSettings(restaurantId, payload) {
  const pool = getDatabasePool();
  
  // Auto-create table if it doesn't exist yet (lazy migration)
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS seo_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NOT NULL,
        meta_title VARCHAR(255) NOT NULL,
        meta_description VARCHAR(500) NOT NULL,
        meta_keywords VARCHAR(500) NOT NULL,
        structured_data_json TEXT,
        sitemap_enabled BOOLEAN DEFAULT TRUE,
        last_submitted_sitemap TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE INDEX(restaurant_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } catch (err) {
    console.error('[SEO] Auto-creation of seo_settings table failed:', err.message);
  }

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
  const cuisine = businessDetails.cuisine || 'Gourmet';
  const location = businessDetails.location || 'Local Area';

  const metaTitle = `Best ${cuisine} Food in ${location} | ${name} | Order Online`;
  const metaDescription = `Indulge in fresh, authentic ${cuisine} cuisine at ${name} in ${location}. Order online for quick local delivery, explore our menu, and earn loyalty rewards today!`;
  const metaKeywords = `${cuisine} food, ${name}, order ${cuisine} online, restaurant in ${location}`;
  
  const structuredDataJson = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": name,
    "servesCuisine": cuisine,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": location
    },
    "priceRange": "$$"
  }, null, 2);

  return {
    metaTitle,
    metaDescription,
    metaKeywords,
    structuredDataJson
  };
}

async function generateSitemapXml(restaurantId = 1) {
  const pool = getDatabasePool();

  let menuItems = [];
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, updated_at FROM menu_items WHERE restaurant_id = ? AND is_available = TRUE',
      [restaurantId]
    );
    menuItems = rows;
  } catch (err) {
    menuItems = [];
  }

  const baseUrl = process.env.PUBLIC_APP_URL || 'http://localhost:5173';
  const now = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // Main pages
  xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
  xml += `  <url>\n    <loc>${baseUrl}/guest</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;

  // Menu items
  menuItems.forEach((item) => {
    const itemMod = item.updated_at ? new Date(item.updated_at).toISOString().split('T')[0] : now;
    xml += `  <url>\n    <loc>${baseUrl}/guest?item=${item.id}</loc>\n    <lastmod>${itemMod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  });

  xml += `</urlset>`;
  return xml;
}

module.exports = {
  getSeoSettings,
  updateSeoSettings,
  generateAiSeoMeta,
  generateSitemapXml
};
