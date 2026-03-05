const { diffNights } = require('./pricingService');

/**
 * Calculate group pricing with optional % or flat discount.
 */
function calculateGroupPricing({
  checkIn,
  checkOut,
  ratePerNight = 0,
  totalRooms = 0,
  discountPercent = 0,
  discountFlat = 0,
}) {
  const nights = diffNights(checkIn, checkOut);
  const base = Number(ratePerNight || 0) * nights * Number(totalRooms || 0);
  const pct = Number(discountPercent || 0);
  const flat = Number(discountFlat || 0);

  const discountAmount = base * pct + flat;
  const finalTotal = Math.max(0, base - discountAmount);

  return {
    nights,
    baseAmount: Number(base.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    finalAmount: Number(finalTotal.toFixed(2)),
  };
}

module.exports = {
  calculateGroupPricing,
};

