function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function diffNights(checkIn, checkOut) {
  const a = startOfDay(checkIn).getTime();
  const b = startOfDay(checkOut).getTime();
  const ms = b - a;
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function isWeekend(date) {
  const d = new Date(date).getDay();
  return d === 5 || d === 6; // Fri/Sat
}

function calculateSeasonalRate(date) {
  const m = new Date(date).getMonth() + 1; // 1-12
  if (m === 12 || m === 1) return 0.15; // peak
  if (m >= 6 && m <= 8) return 0.05; // mild peak
  return 0;
}

function getRatePlanMultiplier(ratePlan) {
  const key = String(ratePlan || 'standard').toLowerCase();
  if (key === 'corporate') return 0.9;
  if (key === 'seasonal') return 1.2;
  return 1.0; // standard
}

function extrasCost({ extras = {}, nights = 1, guests = 1 } = {}) {
  const e = extras || {};
  const g = Math.max(1, Number(guests || 1));
  const n = Math.max(1, Number(nights || 1));

  const breakfast = e.breakfast ? 200 * g * n : 0;
  const airportPickup = e.airportPickup ? 1000 : 0;
  const extraBed = e.extraBed ? 500 * n : 0;

  const custom = Array.isArray(e.customAddOns)
    ? e.customAddOns.reduce((sum, item) => sum + (Number(item?.price || 0) || 0), 0)
    : 0;

  return breakfast + airportPickup + extraBed + custom;
}

/**
 * Dynamic pricing:
 * - ratePlan multiplier (standard/corporate/seasonal)
 * - weekend uplift (Fri/Sat) 10%
 * - seasonal uplift (Dec/Jan 15%, Jun-Aug 5%)
 * - occupancy uplift: +10% per guest above 2
 */
function calculatePricing({
  checkIn,
  checkOut,
  guests = 1,
  ratePlan = 'standard',
  basePricePerNight = 0,
  extras = {},
} = {}) {
  const nights = diffNights(checkIn, checkOut);
  const base = Number(basePricePerNight || 0);
  const rp = getRatePlanMultiplier(ratePlan);

  const occupancyExtraGuests = Math.max(0, Number(guests || 1) - 2);
  const occupancyMultiplier = 1 + occupancyExtraGuests * 0.1;

  let roomCost = 0;
  const daily = [];
  for (let i = 0; i < nights; i++) {
    const day = new Date(startOfDay(checkIn).getTime() + i * 24 * 60 * 60 * 1000);
    const weekendUplift = isWeekend(day) ? 0.1 : 0;
    const seasonalUplift = calculateSeasonalRate(day);
    const multiplier = rp * occupancyMultiplier * (1 + weekendUplift + seasonalUplift);
    const price = base * multiplier;
    roomCost += price;
    daily.push({
      date: day.toISOString().slice(0, 10),
      basePrice: base,
      weekendUplift,
      seasonalUplift,
      ratePlanMultiplier: rp,
      occupancyMultiplier,
      finalPrice: Number(price.toFixed(2)),
    });
  }

  const extrasTotal = extrasCost({ extras, nights, guests });
  const total = roomCost + extrasTotal;

  return {
    nights,
    basePricePerNight: base,
    roomCost: Number(roomCost.toFixed(2)),
    extrasCost: Number(extrasTotal.toFixed(2)),
    total: Number(total.toFixed(2)),
    breakdown: {
      ratePlan: String(ratePlan || 'standard'),
      ratePlanMultiplier: rp,
      occupancyMultiplier,
      daily,
    },
  };
}

module.exports = {
  calculatePricing,
  diffNights,
};

