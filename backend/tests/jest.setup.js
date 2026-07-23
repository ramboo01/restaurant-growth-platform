const { pool, cleanupTestData } = require('./testUtils');

afterAll(async () => {
  await cleanupTestData();
  await pool.end();
});
