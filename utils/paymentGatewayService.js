/**
 * Minimal payment gateway service stub.
 * Real integrations (Stripe, Razorpay, etc.) can plug into these helpers later.
 */

async function configureGateway(methodName, config) {
  // In a real implementation, validate keys or hit the provider's API.
  // For now, we just pretend configuration is always valid.
  return { ok: true, provider: methodName, tested: false, configSummary: Object.keys(config || {}) };
}

async function testGatewayConnection(methodName, config) {
  // Stubbed health check.
  return { ok: true, message: `Test connection to ${methodName} succeeded (stub).` };
}

module.exports = {
  configureGateway,
  testGatewayConnection,
};

