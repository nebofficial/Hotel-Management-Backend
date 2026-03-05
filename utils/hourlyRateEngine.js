const { diffNights } = require('./pricingService');

function toMinutes(dateLike) {
  const d = new Date(dateLike);
  return d.getTime() / (1000 * 60);
}

/**
 * Calculate early check-in and late check-out hours and charges.
 * Rules (simple):
 * - Early: difference between requestedCheckIn and standardCheckIn if earlier
 * - Late: difference between requestedCheckOut and standardCheckOut if later
 * - Hourly rate: nightlyRate / 24
 * - If early or late > 6 hours -> full day charge (nightlyRate)
 * - If between 3-6 hours -> half-day charge (nightlyRate / 2)
 */
function calculateHourlyCharge({
  standardCheckIn,
  standardCheckOut,
  requestedCheckIn,
  requestedCheckOut,
  nightlyRate,
}) {
  const rate = Number(nightlyRate || 0);
  const hourlyRate = rate / 24;

  let earlyHours = 0;
  let lateHours = 0;
  let earlyCharge = 0;
  let lateCharge = 0;

  if (requestedCheckIn && standardCheckIn) {
    const diff = (toMinutes(standardCheckIn) - toMinutes(requestedCheckIn)) / 60;
    if (diff > 0) {
      earlyHours = diff;
      if (diff > 6) earlyCharge = rate;
      else if (diff > 3) earlyCharge = rate / 2;
      else earlyCharge = hourlyRate * diff;
    }
  }

  if (requestedCheckOut && standardCheckOut) {
    const diff = (toMinutes(requestedCheckOut) - toMinutes(standardCheckOut)) / 60;
    if (diff > 0) {
      lateHours = diff;
      if (diff > 6) lateCharge = rate;
      else if (diff > 3) lateCharge = rate / 2;
      else lateCharge = hourlyRate * diff;
    }
  }

  const totalExtraCharge = earlyCharge + lateCharge;

  return {
    earlyHours,
    lateHours,
    earlyCharge,
    lateCharge,
    totalExtraCharge,
    hourlyRate,
  };
}

module.exports = {
  calculateHourlyCharge,
};

