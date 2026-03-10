const express = require('express');
const {
  getTotalRevenue,
  getRevenueByRooms,
  getRevenueByRestaurant,
  getRevenueByServices,
  getDailyRevenue,
  getMonthlyRevenue,
  getRevenueTrend,
  exportRevenueReport,
} = require('../controllers/revenueReportController');

module.exports = function createRevenueReportRoutes(getHotelContext) {
  const router = express.Router({ mergeParams: true });

  router.get('/total', getHotelContext, getTotalRevenue);
  router.get('/by-rooms', getHotelContext, getRevenueByRooms);
  router.get('/by-restaurant', getHotelContext, getRevenueByRestaurant);
  router.get('/by-services', getHotelContext, getRevenueByServices);
  router.get('/daily', getHotelContext, getDailyRevenue);
  router.get('/monthly', getHotelContext, getMonthlyRevenue);
  router.get('/trend', getHotelContext, getRevenueTrend);
  router.get('/export', getHotelContext, exportRevenueReport);

  return router;
};
