/**
 * Simple helpers for integration handling.
 * These are intentionally lightweight and can be expanded later.
 */

async function testIntegrationConnection(integration) {
  // For now we just simulate a connectivity check.
  // In a real system you would call the provider API here.
  if (!integration.enabled) {
    return { success: false, message: 'Integration is disabled' };
  }

  if (!integration.config) {
    return { success: false, message: 'Missing configuration' };
  }

  return { success: true, message: 'Connection looks healthy' };
}

function summarizeStatuses(integrations) {
  const summary = {};
  for (const row of integrations) {
    const key = row.type;
    if (!summary[key]) {
      summary[key] = { connected: 0, disconnected: 0, error: 0 };
    }
    if (row.status === 'connected') summary[key].connected += 1;
    else if (row.status === 'error') summary[key].error += 1;
    else summary[key].disconnected += 1;
  }
  return summary;
}

module.exports = {
  testIntegrationConnection,
  summarizeStatuses,
};

