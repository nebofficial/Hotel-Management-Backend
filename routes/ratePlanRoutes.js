const express = require('express');
const {
  getRatePlans,
  createRatePlan,
  updateRatePlan,
  assignRatePlanToRoomType,
  toggleRatePlanStatus,
  exportRatePlans,
} = require('../controllers/ratePlanController');

module.exports = function createRatePlanRoutes(getHotelContext) {
  const router = express.Router({ mergeParams: true });

  // More specific routes first to avoid conflicts with "/:id"
  router.get('/export', getHotelContext, exportRatePlans);
  router.get('/', getHotelContext, getRatePlans);
  router.post('/', getHotelContext, createRatePlan);
  router.put('/:id', getHotelContext, updateRatePlan);
  router.post('/:id/assign-room-types', getHotelContext, assignRatePlanToRoomType);
  router.post('/:id/toggle-status', getHotelContext, toggleRatePlanStatus);

  return router;
};

