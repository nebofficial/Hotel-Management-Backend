const express = require('express');
const controller = require('../controllers/hrDashboardController');

/**
 * HR & Staff dashboard routes.
 * Mounted under `/api/hotel-data/:hotelId/hr-dashboard`.
 */
module.exports = function createHrDashboardRoutes(getHotelContext) {
  const router = express.Router({ mergeParams: true });

  router.get('/staff-summary', getHotelContext, controller.fetchStaffSummary);
  router.get('/duty-status', getHotelContext, controller.fetchDutyStatus);
  router.get('/leave-requests', getHotelContext, controller.fetchLeaveRequests);
  router.get('/attendance', getHotelContext, controller.fetchAttendanceStats);
  router.get('/distribution', getHotelContext, controller.fetchStaffDistribution);

  return router;
};

