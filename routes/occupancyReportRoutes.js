const express = require('express');
const {
  getDailyOccupancy,
  getWeeklyOccupancy,
  getMonthlyOccupancy,
  getRoomTypeOccupancy,
  getOccupancySummary,
  exportOccupancyReport,
} = require('../controllers/occupancyReportController');

module.exports = function createOccupancyReportRoutes(getHotelContext) {
  const router = express.Router({ mergeParams: true });

  router.get('/summary', getHotelContext, getOccupancySummary);
  router.get('/daily', getHotelContext, getDailyOccupancy);
  router.get('/weekly', getHotelContext, getWeeklyOccupancy);
  router.get('/monthly', getHotelContext, getMonthlyOccupancy);
  router.get('/room-type', getHotelContext, getRoomTypeOccupancy);
  router.get('/export', getHotelContext, exportOccupancyReport);

  return router;
};
