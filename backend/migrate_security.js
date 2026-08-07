const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  await pool.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked TINYINT(1) NOT NULL DEFAULT 0`).catch(()=>{});
  await pool.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP NULL`).catch(()=>{});
  await pool.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked_reason VARCHAR(255) NULL`).catch(()=>{});
  await pool.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP NULL`).catch(()=>{});

  const [cols] = await pool.execute('DESCRIBE users');
  console.log('✅ Users table columns:');
  cols.forEach(c => console.log(` - ${c.Field}: ${c.Type} | default: ${c.Default}`));

  process.exit(0);
})();
