const express = require('express');
const {
  getRoomRevenueSummary,
  getRevenueByRoomType,
  getRevenueByDateRange,
  getRevenueTrend,
  getRoomRevenueDetails,
  exportRoomRevenueReport,
} = require('../controllers/roomRevenueController');

module.exports = function createRoomRevenueRoutes(getHotelContext) {
  const router = express.Router({ mergeParams: true });

  router.get('/summary', getHotelContext, getRoomRevenueSummary);
  router.get('/by-room-type', getHotelContext, getRevenueByRoomType);
  router.get('/by-date-range', getHotelContext, getRevenueByDateRange);
  router.get('/trend', getHotelContext, getRevenueTrend);
  router.get('/details', getHotelContext, getRoomRevenueDetails);
  router.get('/export', getHotelContext, exportRoomRevenueReport);

  return router;
};
