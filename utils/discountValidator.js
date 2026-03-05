/**
 * Validates discount amount and checks if manager approval is required
 */
const DEFAULT_APPROVAL_LIMIT = 500; // ₹

function validateDiscount(subtotal, discountAmount, discountPercent, approvalLimit = DEFAULT_APPROVAL_LIMIT) {
  const sub = Number(subtotal) || 0;
  const amt = Number(discountAmount) || 0;
  const pct = Number(discountPercent) || 0;
  const limit = Number(approvalLimit) || DEFAULT_APPROVAL_LIMIT;

  const effectiveAmount = amt > 0 ? amt : (sub * pct) / 100;
  const maxAllowed = sub * 0.5; // Max 50% discount without special override

  if (effectiveAmount > sub) {
    return { ok: false, message: 'Discount cannot exceed subtotal' };
  }
  if (effectiveAmount > maxAllowed) {
    return { ok: false, message: 'Discount exceeds maximum allowed (50%)' };
  }

  const requiresApproval = effectiveAmount >= limit;
  return {
    ok: true,
    effectiveAmount,
    requiresApproval,
    message: requiresApproval ? `Manager approval required for discount ≥ ₹${limit}` : null,
  };
}

module.exports = { validateDiscount, DEFAULT_APPROVAL_LIMIT };
