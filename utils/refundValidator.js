function safeNumber(v) {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

/**
 * Basic refund validation for a room bill / booking.
 * Assumes:
 *  - totalPaid: total amount actually paid
 *  - alreadyRefunded: sum of previous refunds
 */
function validateRefund({ totalPaid, alreadyRefunded, requestedAmount }) {
  const paid = safeNumber(totalPaid);
  const refunded = safeNumber(alreadyRefunded);
  const req = safeNumber(requestedAmount);

  if (req <= 0) {
    return { ok: false, message: 'Refund amount must be greater than 0' };
  }

  const remaining = paid - refunded;
  if (remaining <= 0) {
    return { ok: false, message: 'No refundable balance remaining for this bill' };
  }

  if (req > remaining) {
    return {
      ok: false,
      message: `Refund amount cannot exceed remaining paid amount (₹${remaining.toFixed(2)})`,
    };
  }

  return { ok: true, remaining, requested: req };
}

module.exports = { validateRefund };

