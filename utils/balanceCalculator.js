function safeNumber(v) {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

/**
 * Compute aggregate advance balances from a list of AdvancePayment rows.
 */
function calculateAdvanceBalances(list = []) {
  let totalCollected = 0;
  let totalAdjusted = 0;
  let totalRefunded = 0;

  list.forEach((a) => {
    totalCollected += safeNumber(a.amount);
    totalAdjusted += safeNumber(a.adjustedAmount);
    totalRefunded += safeNumber(a.refundedAmount);
  });

  const balanceAvailable = totalCollected - totalAdjusted - totalRefunded;

  return {
    totalCollected,
    totalAdjusted,
    totalRefunded,
    balanceAvailable,
  };
}

module.exports = { calculateAdvanceBalances };

