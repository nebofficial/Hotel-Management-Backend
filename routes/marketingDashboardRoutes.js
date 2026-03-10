const express = require('express');
const {
  getRoomPricingOverview,
  getBookingPerformance,
  getCampaignSummary,
  getOtaBookingInsights,
  getRatePlanPerformance,
  getRevenueByRoomCategory,
  getRecentMarketingActivities,
} = require('../controllers/marketingDashboardController');

module.exports = function createMarketingDashboardRoutes(getHotelContext) {
  const router = express.Router({ mergeParams: true });

  router.get('/room-pricing', getHotelContext, getRoomPricingOverview);
  router.get('/booking-performance', getHotelContext, getBookingPerformance);
  router.get('/campaigns', getHotelContext, getCampaignSummary);
  router.get('/ota-insights', getHotelContext, getOtaBookingInsights);
  router.get('/rate-plans', getHotelContext, getRatePlanPerformance);
  router.get('/revenue-by-room-category', getHotelContext, getRevenueByRoomCategory);
  router.get('/recent-activity', getHotelContext, getRecentMarketingActivities);

  return router;
};

