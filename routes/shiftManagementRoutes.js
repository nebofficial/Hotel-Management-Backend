const express = require('express');
const {
  fetchShifts,
  createShift,
  updateShift,
  deleteShift,
  assignShiftToStaff,
  fetchShiftSchedule,
  checkConflict,
  requestShiftChange,
  fetchShiftChangeRequests,
  approveShiftChange,
  rejectShiftChange,
  exportShiftSchedule,
  fetchStaff,
} = require('../controllers/shiftManagementController');

/**
 * Shift Management routes.
 * Mounted under /api/hotel-data/:hotelId/shift-management
 */
module.exports = function createShiftManagementRoutes(getHotelContext) {
  const router = express.Router({ mergeParams: true });

  router.get('/shifts', getHotelContext, fetchShifts);
  router.post('/shifts', getHotelContext, createShift);
  router.put('/shifts/:shiftId', getHotelContext, updateShift);
  router.delete('/shifts/:shiftId', getHotelContext, deleteShift);

  router.get('/staff', getHotelContext, fetchStaff);
  router.post('/assign', getHotelContext, assignShiftToStaff);
  router.get('/schedule', getHotelContext, fetchShiftSchedule);
  router.get('/check-conflict', getHotelContext, checkConflict);

  router.post('/change-requests', getHotelContext, requestShiftChange);
  router.get('/change-requests', getHotelContext, fetchShiftChangeRequests);
  router.post('/change-requests/:requestId/approve', getHotelContext, approveShiftChange);
  router.post('/change-requests/:requestId/reject', getHotelContext, rejectShiftChange);

  router.get('/export', getHotelContext, exportShiftSchedule);

  return router;
};
