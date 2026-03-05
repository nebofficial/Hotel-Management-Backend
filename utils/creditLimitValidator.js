function validateCreditLimit({ creditLimit, currentOutstanding, newCharge }) {
  const limit = Number(creditLimit || 0) || 0;
  const outstanding = Number(currentOutstanding || 0) || 0;
  const charge = Number(newCharge || 0) || 0;

  if (limit <= 0) return { ok: true, withinLimit: true };

  const after = outstanding + charge;
  if (after > limit) {
    return {
      ok: false,
      withinLimit: false,
      message: `Credit limit exceeded. Limit ₹${limit.toFixed(2)}, outstanding after invoice ₹${after.toFixed(
        2,
      )}.`,
    };
  }

  return { ok: true, withinLimit: true };
}

module.exports = { validateCreditLimit };

