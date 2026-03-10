const { calculatePricing } = require('./pricingService');

function simulateRatePlanPricing({ basePricePerNight = 0, ratePlan = 'standard' }) {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return calculatePricing({
    checkIn: today,
    checkOut: tomorrow,
    guests: 2,
    ratePlan,
    basePricePerNight,
    extras: {},
  });
}

module.exports = {
  simulateRatePlanPricing,
};

