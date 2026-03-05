/**
 * Simple approval rules:
 * - Require approval if total charge > threshold (e.g., 0 for now)
 * - Could be extended for VIPs, etc.
 */
function requiresApproval({ totalCharge }) {
  const amount = Number(totalCharge || 0);
  const threshold = 0; // set non-zero later if desired
  return amount > threshold;
}

module.exports = {
  requiresApproval,
};

