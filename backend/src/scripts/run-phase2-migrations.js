const m30 = require('../database/migrations/030_create_guest_merge_candidates_table');
const m31 = require('../database/migrations/031_create_guest_merge_history_table');
const m32 = require('../database/migrations/032_patch_customer_identity_fields');

async function run() {
  console.log('[Phase 2 Migration] Running migrations...');
  try {
    await m30.up();
    await m31.up();
    await m32.up();
    console.log('[Phase 2 Migration] Successfully executed all Phase 2 migrations!');
    process.exit(0);
  } catch (err) {
    console.error('[Phase 2 Migration] Error running migrations:', err.message);
    process.exit(1);
  }
}

run();
