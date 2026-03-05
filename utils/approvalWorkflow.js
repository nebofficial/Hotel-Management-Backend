const DEFAULT_REFUND_LIMIT = 5000; // configurable threshold

function needsManagerApproval({ amount }) {
  const amt = Number(amount || 0) || 0;
  if (amt <= 0) return { required: false, reason: null };
  if (amt >= DEFAULT_REFUND_LIMIT) {
    return {
      required: true,
      reason: `Refunds above ₹${DEFAULT_REFUND_LIMIT} require manager approval.`,
    };
  }
  return { required: false, reason: null };
}

module.exports = { needsManagerApproval, DEFAULT_REFUND_LIMIT };

