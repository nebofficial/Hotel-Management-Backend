const express = require('express');
const {
  getInventorySummary,
  getCurrentStock,
  getLowStockItems,
  getStockMovement,
  getInventoryConsumption,
  getInventoryValuation,
  getInventoryTrend,
  exportInventoryReport,
} = require('../controllers/inventoryReportController');

module.exports = function createInventoryReportRoutes(getHotelContext) {
  const router = express.Router({ mergeParams: true });

  router.get('/summary', getHotelContext, getInventorySummary);
  router.get('/current-stock', getHotelContext, getCurrentStock);
  router.get('/low-stock', getHotelContext, getLowStockItems);
  router.get('/stock-movement', getHotelContext, getStockMovement);
  router.get('/consumption', getHotelContext, getInventoryConsumption);
  router.get('/valuation', getHotelContext, getInventoryValuation);
  router.get('/trend', getHotelContext, getInventoryTrend);
  router.get('/export', getHotelContext, exportInventoryReport);

  return router;
};
