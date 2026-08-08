const { processPendingRefunds } = require('../modules/order/reconciliation.service');

let isRunning = false;

function startReconciliationWorker(intervalMs = 30000) {
  console.log(`[Auto-Reconciliation Worker] Starting background worker loop (Interval: ${intervalMs}ms)...`);
  
  setInterval(async () => {
    if (isRunning) return;
    isRunning = true;
    try {
      await processPendingRefunds();
    } catch (err) {
      console.error('[Auto-Reconciliation Worker] Worker loop error:', err.message);
    } finally {
      isRunning = false;
    }
  }, intervalMs);
}

module.exports = { startReconciliationWorker };
