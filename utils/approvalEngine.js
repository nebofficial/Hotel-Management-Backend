const DEFAULT_LIMIT = 5000; // ₹ threshold for manager approval

function needsRefundApproval({ amount, fullCancellation }) {
  const amt = Number(amount || 0) || 0;
  if (fullCancellation) {
    return { required: true, reason: 'Full bill cancellations require manager approval.' };
  }
  if (amt >= DEFAULT_LIMIT) {
    return {
      required: true,
      reason: `Refunds above ₹${DEFAULT_LIMIT} require manager approval.`,
    };
  }
  return { required: false, reason: null };
}

module.exports = { needsRefundApproval, DEFAULT_LIMIT };

