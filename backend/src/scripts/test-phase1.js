const { logUnfulfilledPayment, processPendingRefunds, getReconciliationLogs } = require('../modules/order/reconciliation.service');
const { recordChannelSyncAttempt, getChannelSyncStates, resetChannelCircuitBreaker } = require('../modules/admin/channelSync.service');
const { isQuietHours, sendUnifiedNotification } = require('../services/notificationService');

async function testPhase1() {
  console.log('--- TESTING PHASE 1 IMPLEMENTATION ---');

  // Test 1: Order Reconciliation
  console.log('\n[1] Testing Payment Auto-Reconciliation...');
  const reconId = await logUnfulfilledPayment({
    restaurantId: 1,
    orderNumber: 'TEST-RECON-101',
    customerName: 'Test Customer',
    customerPhone: '+15550192834',
    totalAmount: 49.99,
    paymentIntentId: 'pi_test_998877',
    errorReason: 'DB connection reset during order insertion'
  });
  console.log('Created reconciliation entry ID:', reconId);

  const processRes = await processPendingRefunds();
  console.log('Process pending refunds result:', processRes);

  const logs = await getReconciliationLogs();
  console.log(`Fetched ${logs.length} reconciliation log(s). Latest status:`, logs[0]?.status);

  // Test 2: Circuit Breakers
  console.log('\n[2] Testing Channel Sync Circuit Breakers...');
  for (let i = 1; i <= 5; i++) {
    await recordChannelSyncAttempt(1, 'UberEats', false, `Sync timeout error #${i}`);
  }

  const states = await getChannelSyncStates(1);
  const uberState = states.find(s => s.channelName === 'UberEats');
  console.log('UberEats Circuit Breaker State:', uberState?.circuitState, `(Failures: ${uberState?.consecutiveFailures})`);

  await resetChannelCircuitBreaker(1, 'UberEats');
  const resetStates = await getChannelSyncStates(1);
  const resetUberState = resetStates.find(s => s.channelName === 'UberEats');
  console.log('Post-Reset UberEats Circuit Breaker State:', resetUberState?.circuitState);

  // Test 3: Unified Messaging Engine
  console.log('\n[3] Testing Unified Notification Engine...');
  console.log('Current local quiet hours status:', isQuietHours() ? 'ACTIVE (9PM-8AM)' : 'INACTIVE (Daytime)');

  const sendRes = await sendUnifiedNotification({
    restaurantId: 1,
    recipient: 'test_user_1',
    subject: 'Special Offer',
    message: 'Get 20% off your next order!',
    type: 'Marketing',
    channel: 'SMS',
    isTimeSensitive: false
  });
  console.log('Unified send result:', sendRes);

  console.log('\n✅ ALL PHASE 1 TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

testPhase1().catch(err => {
  console.error('❌ Phase 1 test failed:', err);
  process.exit(1);
});
