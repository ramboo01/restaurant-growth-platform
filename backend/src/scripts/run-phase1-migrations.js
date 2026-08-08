const m28 = require('../database/migrations/028_create_order_reconciliations_table');
const m29 = require('../database/migrations/029_create_channel_sync_states_table');

async function run() {
  console.log('[Phase 1 Migration] Running migrations...');
  try {
    await m28.up();
    await m29.up();
    console.log('[Phase 1 Migration] Successfully executed all Phase 1 migrations!');
    process.exit(0);
  } catch (err) {
    console.error('[Phase 1 Migration] Error running migrations:', err.message);
    process.exit(1);
  }
}

run();
