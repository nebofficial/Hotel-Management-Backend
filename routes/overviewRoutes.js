const express = require('express');
const {
  getOverviewKpis,
  getRevenueTrend,
  getOccupancyTrend,
} = require('../controllers/overviewController');

module.exports = function createOverviewRoutes(getHotelContext) {
  const router = express.Router({ mergeParams: true });

  router.get('/kpis', getHotelContext, getOverviewKpis);
  router.get('/revenue-trend', getHotelContext, getRevenueTrend);
  router.get('/occupancy-trend', getHotelContext, getOccupancyTrend);

  return router;
};

