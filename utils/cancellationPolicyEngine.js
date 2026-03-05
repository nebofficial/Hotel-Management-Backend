const { diffNights } = require('./pricingService');

/**
 * Very simple cancellation policy engine.
 * Inputs: booking, now, nightlyRate, advancePaid
 */
function calculateCancellationPolicy({ booking, asOf, nightlyRate, advancePaid }) {
  const checkIn = new Date(booking.checkIn);
  const now = asOf ? new Date(asOf) : new Date();
  const msDiff = checkIn.getTime() - now.getTime();
  const hoursBeforeCheckIn = msDiff / (1000 * 60 * 60);

  const rate = Number(nightlyRate || 0);
  const advance = Number(advancePaid || 0);

  // Example rules:
  // > 48h before check-in: free cancellation
  // 24–48h: 50% of one night
  // < 24h: 100% of one night (retention)

  let policyType = 'flexible';
  let cancellationFee = 0;

  if (hoursBeforeCheckIn > 48) {
    policyType = 'free_before_48h';
    cancellationFee = 0;
  } else if (hoursBeforeCheckIn > 24) {
    policyType = 'half_day_retention';
    cancellationFee = rate * 0.5;
  } else if (hoursBeforeCheckIn > 0) {
    policyType = 'one_night_retention';
    cancellationFee = rate;
  } else {
    // after check-in time: treat as no-show style
    policyType = 'late_cancellation';
    cancellationFee = rate;
  }

  const refundableAmount = Math.max(0, advance - cancellationFee);

  return {
    policyType,
    hoursBeforeCheckIn,
    nightlyRate: rate,
    advancePaid: advance,
    cancellationFee,
    refundableAmount,
  };
}

module.exports = {
  calculateCancellationPolicy,
};

