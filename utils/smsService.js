/**
 * Simple SMS service placeholder.
 * In production you would integrate an actual SMS gateway (Twilio, MSG91, etc).
 * For now we just log messages to the server console.
 */

async function sendSms({ to, message }) {
  if (!to || !message) {
    throw new Error('to and message are required for SMS');
  }
  console.log('[SMS] Sending SMS to', to, 'message:', message);
  // Simulate async operation
  return { success: true };
}

module.exports = {
  sendSms,
};

