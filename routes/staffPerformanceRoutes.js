const express = require('express');
const {
  getAttendancePerformance,
  getTaskCompletion,
  getSalesPerformance,
  getCommissionPerformance,
  getDepartmentPerformance,
  exportStaffPerformanceReport,
} = require('../controllers/staffPerformanceController');

module.exports = function createStaffPerformanceRoutes(getHotelContext) {
  const router = express.Router({ mergeParams: true });

  router.get('/attendance', getHotelContext, getAttendancePerformance);
  router.get('/tasks', getHotelContext, getTaskCompletion);
  router.get('/sales', getHotelContext, getSalesPerformance);
  router.get('/commissions', getHotelContext, getCommissionPerformance);
  router.get('/departments', getHotelContext, getDepartmentPerformance);
  router.get('/export', getHotelContext, exportStaffPerformanceReport);

  return router;
};

