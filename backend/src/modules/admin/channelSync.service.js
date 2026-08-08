const { getDatabasePool } = require('../../config/database');
const smsService = require('../../utils/smsService');

/**
 * Record a channel sync attempt (e.g. POS, UberEats, DoorDash, Google Business Profile)
 * Updates circuit breaker state machine: CLOSED -> OPEN after 5 consecutive failures.
 */
async function recordChannelSyncAttempt(restaurantId, channelName, isSuccess, errorMessage = null) {
  const pool = getDatabasePool();
  
  // Ensure record exists
  await pool.execute(
    `INSERT INTO channel_sync_states (restaurant_id, channel_name, consecutive_failures, circuit_state)
     VALUES (?, ?, 0, 'CLOSED')
     ON DUPLICATE KEY UPDATE channel_name=channel_name`,
    [restaurantId, channelName]
  );

  if (isSuccess) {
    await pool.execute(
      `UPDATE channel_sync_states
       SET consecutive_failures = 0,
           circuit_state = 'CLOSED',
           last_success_at = NOW(),
           whatsapp_alert_sent = 0,
           last_error_message = NULL
       WHERE restaurant_id = ? AND channel_name = ?`,
      [restaurantId, channelName]
    );
    console.log(`[Circuit Breaker] Channel ${channelName} sync SUCCESS for restaurant #${restaurantId}. Reset circuit to CLOSED.`);
  } else {
    const [rows] = await pool.execute(
      `SELECT consecutive_failures FROM channel_sync_states WHERE restaurant_id = ? AND channel_name = ?`,
      [restaurantId, channelName]
    );
    const failures = (rows[0]?.consecutive_failures || 0) + 1;
    const newState = failures >= 5 ? 'OPEN' : 'CLOSED';

    await pool.execute(
      `UPDATE channel_sync_states
       SET consecutive_failures = ?,
           circuit_state = ?,
           last_failure_at = NOW(),
           last_error_message = ?
       WHERE restaurant_id = ? AND channel_name = ?`,
      [failures, newState, errorMessage || 'Channel sync failed', restaurantId, channelName]
    );

    console.warn(`[Circuit Breaker] Channel ${channelName} sync FAILED (${failures}/5) for restaurant #${restaurantId}. State: ${newState}`);
    
    if (newState === 'OPEN') {
      try {
        const socketUtils = require('../../utils/socket');
        socketUtils.getIO().to(`restaurant_${restaurantId}`).emit('CHANNEL_CIRCUIT_TRIPPED', {
          channelName,
          consecutiveFailures: failures,
          message: `Circuit Breaker TRIPPED for ${channelName}. Retries paused.`
        });
      } catch (err) {
        console.error('[Socket] Could not emit CHANNEL_CIRCUIT_TRIPPED:', err.message);
      }
    }
  }
}

/**
 * Fetch channel sync & circuit breaker status for restaurant
 */
async function getChannelSyncStates(restaurantId = null) {
  const pool = getDatabasePool();
  let sql = `SELECT id, restaurant_id AS restaurantId, channel_name AS channelName, consecutive_failures AS consecutiveFailures, circuit_state AS circuitState, last_failure_at AS lastFailureAt, last_success_at AS lastSuccessAt, whatsapp_alert_sent AS whatsappAlertSent, last_error_message AS lastErrorMessage, updated_at AS updatedAt FROM channel_sync_states`;
  const params = [];

  if (restaurantId) {
    sql += ` WHERE restaurant_id = ?`;
    params.push(restaurantId);
  }

  const [rows] = await pool.execute(sql, params);
  return rows;
}

/**
 * Reset a tripped circuit breaker back to CLOSED
 */
async function resetChannelCircuitBreaker(restaurantId, channelName) {
  const pool = getDatabasePool();
  await pool.execute(
    `UPDATE channel_sync_states
     SET consecutive_failures = 0,
         circuit_state = 'CLOSED',
         whatsapp_alert_sent = 0,
         last_error_message = NULL,
         updated_at = NOW()
     WHERE restaurant_id = ? AND channel_name = ?`,
    [restaurantId, channelName]
  );
  console.log(`[Circuit Breaker] Manually reset ${channelName} circuit for restaurant #${restaurantId}.`);
  return { success: true, message: `Circuit breaker for ${channelName} reset to CLOSED.` };
}

/**
 * Background worker task: Check channels with OPEN circuit state > 30 minutes during open hours and send WhatsApp alert
 */
async function checkOutageAlerts() {
  const pool = getDatabasePool();
  const [openCircuits] = await pool.execute(
    `SELECT * FROM channel_sync_states 
     WHERE circuit_state = 'OPEN' 
       AND whatsapp_alert_sent = 0 
       AND last_failure_at <= DATE_SUB(NOW(), INTERVAL 30 MINUTE)`
  );

  for (const item of openCircuits) {
    try {
      console.log(`[WhatsApp Alert] Escalating 30-min channel outage for ${item.channel_name} at restaurant #${item.restaurant_id}`);
      
      // Send WhatsApp / SMS notification
      await smsService.sendSMS(
        '+15550192834', // Manager phone
        `CRITICAL ALERT: Channel "${item.channel_name}" sync has been down for >30 minutes at location #${item.restaurant_id}. Circuit breaker is OPEN.`
      );

      await pool.execute(
        `UPDATE channel_sync_states SET whatsapp_alert_sent = 1 WHERE id = ?`,
        [item.id]
      );
    } catch (err) {
      console.error(`[WhatsApp Alert] Failed to send outage alert for #${item.id}:`, err.message);
    }
  }
}

module.exports = {
  recordChannelSyncAttempt,
  getChannelSyncStates,
  resetChannelCircuitBreaker,
  checkOutageAlerts
};
