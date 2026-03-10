const express = require('express');
const controller = require('../controllers/attendanceController');

/**
 * Attendance routes.
 * Mounted under `/api/hotel-data/:hotelId/attendance`.
 */
module.exports = function createAttendanceRoutes(getHotelContext) {
  const router = express.Router({ mergeParams: true });

  router.post('/mark', getHotelContext, controller.markAttendance);
  router.get('/daily', getHotelContext, controller.fetchDailyAttendance);
  router.get('/list', getHotelContext, controller.fetchAttendanceList);
  router.get('/calendar', getHotelContext, controller.fetchAttendanceCalendar);
  router.post('/report', getHotelContext, controller.generateAttendanceReport);
  router.post('/export', getHotelContext, controller.exportAttendance);

  return router;
};

