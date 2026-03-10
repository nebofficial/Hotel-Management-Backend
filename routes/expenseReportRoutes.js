const express = require('express');
const {
  getExpenseSummary,
  getDailyExpenses,
  getMonthlyExpenses,
  getDepartmentExpenses,
  getVendorPayments,
  getExpenseTrend,
  getExpenseDetails,
  exportExpenseReport,
} = require('../controllers/expenseReportController');

module.exports = function createExpenseReportRoutes(getHotelContext) {
  const router = express.Router({ mergeParams: true });

  router.get('/summary', getHotelContext, getExpenseSummary);
  router.get('/daily', getHotelContext, getDailyExpenses);
  router.get('/monthly', getHotelContext, getMonthlyExpenses);
  router.get('/department', getHotelContext, getDepartmentExpenses);
  router.get('/vendor-payments', getHotelContext, getVendorPayments);
  router.get('/trend', getHotelContext, getExpenseTrend);
  router.get('/details', getHotelContext, getExpenseDetails);
  router.get('/export', getHotelContext, exportExpenseReport);

  return router;
};
