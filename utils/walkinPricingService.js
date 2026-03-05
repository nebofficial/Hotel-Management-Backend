/**
 * Walk-in specific pricing calculations with occupancy, weekend, seasonal adjustments.
 */

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

function getSeasonalMultiplier(date) {
  const m = new Date(date).getMonth() + 1;
  if (m === 12 || m === 1) return 0.15; // peak season
  if (m >= 6 && m <= 8) return 0.05; // mild peak
  return 0;
}

function getOccupancyMultiplier(occupancyType) {
  const type = String(occupancyType || 'single').toLowerCase();
  switch (type) {
    case 'double':
      return 1.1;
    case 'triple':
      return 1.25;
    case 'quad':
      return 1.4;
    default:
      return 1.0;
  }
}

const TAX_RATE = 0.12; // 12% GST

/**
 * Calculate walk-in pricing with all adjustments.
 */
function calculateWalkinPricing({
  checkIn,
  checkOut,
  baseRoomRate = 0,
  occupancyType = 'single',
  extraBed = false,
  extraServices = [],
}) {
  const nights = diffNights(checkIn, checkOut);
  const base = Number(baseRoomRate || 0);
  const occMultiplier = getOccupancyMultiplier(occupancyType);

  let roomCharges = 0;
  let weekendChargeTotal = 0;
  let seasonalChargeTotal = 0;
  const dailyBreakdown = [];

  for (let i = 0; i < nights; i++) {
    const day = new Date(startOfDay(checkIn).getTime() + i * 24 * 60 * 60 * 1000);
    const weekendRate = isWeekend(day) ? 0.1 : 0;
    const seasonalRate = getSeasonalMultiplier(day);

    const dayBase = base * occMultiplier;
    const weekendCharge = dayBase * weekendRate;
    const seasonalCharge = dayBase * seasonalRate;
    const dayTotal = dayBase + weekendCharge + seasonalCharge;

    roomCharges += dayBase;
    weekendChargeTotal += weekendCharge;
    seasonalChargeTotal += seasonalCharge;

    dailyBreakdown.push({
      date: day.toISOString().slice(0, 10),
      baseRate: Number(dayBase.toFixed(2)),
      weekendCharge: Number(weekendCharge.toFixed(2)),
      seasonalCharge: Number(seasonalCharge.toFixed(2)),
      dayTotal: Number(dayTotal.toFixed(2)),
    });
  }

  const occupancyCharge = roomCharges - base * nights;
  const extraBedCharge = extraBed ? 500 * nights : 0;

  const extraServicesTotal = Array.isArray(extraServices)
    ? extraServices.reduce((sum, s) => sum + Number(s.price || 0), 0)
    : 0;

  const subtotal = roomCharges + weekendChargeTotal + seasonalChargeTotal + extraBedCharge + extraServicesTotal;
  const taxAmount = subtotal * TAX_RATE;
  const totalAmount = subtotal + taxAmount;

  return {
    nights,
    baseRoomRate: base,
    occupancyType,
    occupancyCharge: Number(occupancyCharge.toFixed(2)),
    weekendCharge: Number(weekendChargeTotal.toFixed(2)),
    seasonalCharge: Number(seasonalChargeTotal.toFixed(2)),
    extraBedCharge: Number(extraBedCharge.toFixed(2)),
    extraServicesTotal: Number(extraServicesTotal.toFixed(2)),
    subtotal: Number(subtotal.toFixed(2)),
    taxRate: TAX_RATE,
    taxAmount: Number(taxAmount.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
    dailyBreakdown,
  };
}

module.exports = {
  calculateWalkinPricing,
  diffNights,
};
