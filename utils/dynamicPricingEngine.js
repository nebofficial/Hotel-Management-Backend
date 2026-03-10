const { calculatePricing } = require('./pricingService');

/**
 * Apply seasonal pricing adjustments on top of base dynamic pricing.
 *
 * @param {Object} options
 * @param {number} options.basePricePerNight - base price before seasonal rules
 * @param {Date|string} options.date - date for which price is being calculated
 * @param {string} options.roomType - room type name
 * @param {Array<Object>} options.rules - list of SeasonalPricingRule objects (plain JSON)
 */
function applySeasonalAdjustments({ basePricePerNight, date, roomType, rules = [] } = {}) {
  const base = Number(basePricePerNight || 0);
  if (!base || !date) return base;

  const targetDate = new Date(date);
  const dateStr = targetDate.toISOString().slice(0, 10);

  const applicable = (rules || []).filter((r) => {
    if (!r.isActive) return false;
    const start = new Date(r.startDate);
    const end = new Date(r.endDate);
    if (targetDate < start || targetDate > end) return false;
    if (roomType && Array.isArray(r.roomTypes) && r.roomTypes.length > 0) {
      const lower = roomType.toLowerCase();
      if (!r.roomTypes.some((rt) => String(rt).toLowerCase() === lower)) return false;
    }
    // Weekend rules: if weekendDays is set, require match
    if (r.ruleType === 'weekend' && Array.isArray(r.weekendDays) && r.weekendDays.length > 0) {
      const day = targetDate.getDay(); // 0-6
      const key = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][day];
      if (!r.weekendDays.includes(key)) return false;
    }
    return true;
  });

  let price = base;
  applicable.forEach((rule) => {
    const pct = Number(rule.adjustmentPercent || 0) || 0;
    if (!pct) return;
    const multiplier =
      rule.adjustmentType === 'discount' ? 1 - pct / 100 : 1 + pct / 100;
    price *= multiplier;
  });

  return Number(price.toFixed(2));
}

/**
 * High-level helper: calculate final pricing for a stay including
 * built-in weekend/seasonal logic from pricingService and custom rules.
 */
function calculateDynamicPriceWithSeasons({
  checkIn,
  checkOut,
  guests = 1,
  ratePlan = 'standard',
  basePricePerNight = 0,
  extras = {},
  roomType,
  seasonalRules = [],
} = {}) {
  const baseResult = calculatePricing({
    checkIn,
    checkOut,
    guests,
    ratePlan,
    basePricePerNight,
    extras,
  });

  const adjustedDaily = (baseResult.breakdown?.daily || []).map((d) => {
    const adjusted = applySeasonalAdjustments({
      basePricePerNight: d.finalPrice,
      date: d.date,
      roomType,
      rules: seasonalRules,
    });
    return { ...d, seasonalAdjustedPrice: adjusted };
  });

  const total = adjustedDaily.reduce((sum, d) => sum + Number(d.seasonalAdjustedPrice || d.finalPrice || 0), 0);

  return {
    ...baseResult,
    roomCost: Number(total.toFixed(2)),
    breakdown: {
      ...(baseResult.breakdown || {}),
      daily: adjustedDaily,
    },
  };
}

module.exports = {
  applySeasonalAdjustments,
  calculateDynamicPriceWithSeasons,
};

