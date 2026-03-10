const express = require('express');
const {
  getRevenueSummary,
  getOccupancyStats,
  getRestaurantSales,
  getExpenseSummary,
  getCharts,
  exportReport,
} = require('../controllers/reportsDashboardController');

/**
 * Reports dashboard routes for a specific hotel.
 * Mounted under `/api/hotel-data/:hotelId/reports-dashboard`.
 */
module.exports = function createReportsDashboardRoutes(getHotelContext) {
  const router = express.Router({ mergeParams: true });

  router.get('/revenue-summary', getHotelContext, getRevenueSummary);
  router.get('/occupancy-stats', getHotelContext, getOccupancyStats);
  router.get('/restaurant-sales', getHotelContext, getRestaurantSales);
  router.get('/expense-summary', getHotelContext, getExpenseSummary);
  router.get('/charts', getHotelContext, getCharts);
  router.get('/export', getHotelContext, exportReport);

  return router;
};
