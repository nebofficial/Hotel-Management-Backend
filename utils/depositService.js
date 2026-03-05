/**
 * Simple deposit rules for check-in.
 * - Default: 1 night room rate
 * - Suites: 2 nights
 */
function calculateRequiredDeposit({ roomType, nightlyRate, nights }) {
  const rate = Number(nightlyRate || 0);
  const n = Math.max(1, Number(nights || 1));
  const type = String(roomType || '').toLowerCase();

  if (!rate) return 0;

  if (type.includes('suite')) {
    return rate * Math.min(2, n);
  }
  return rate * 1;
}

module.exports = {
  calculateRequiredDeposit,
};

