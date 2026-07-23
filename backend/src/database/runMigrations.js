const fs = require('fs');
const path = require('path');
const { getDatabasePool } = require('../config/database');

async function runMigrations() {
  const migrationsDir = path.resolve(__dirname, 'migrations');
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.js'))
    .sort();

  const pool = getDatabasePool();

  for (const file of migrationFiles) {
    const migrationPath = path.join(migrationsDir, file);
    const migration = require(migrationPath);

    if (typeof migration.up !== 'function') {
      throw new Error(`Migration ${file} is missing an up() function.`);
    }

    await migration.up(pool);
    console.log(`[migrate] applied ${migration.name || file}`);
  }
}

runMigrations()
  .then(async () => {
    await getDatabasePool().end();
    console.log('[migrate] completed successfully.');
  })
  .catch(async (error) => {
    console.error('[migrate] failed:', error);
    console.error('[migrate] stack:', error.stack);
    try {
      await getDatabasePool().end();
    } catch (closeError) {
      console.error('[migrate] pool close failed:', closeError);
    }
    process.exitCode = 1;
  });
