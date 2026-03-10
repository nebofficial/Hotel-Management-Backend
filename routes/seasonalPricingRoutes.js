const express = require('express');
const {
  getSeasonalRules,
  createSeasonRule,
  updateSeasonRule,
  deleteSeasonRule,
  assignSeasonRuleToRoomType,
} = require('../controllers/seasonalPricingController');

module.exports = function createSeasonalPricingRoutes(getHotelContext) {
  const router = express.Router({ mergeParams: true });

  router.get('/', getHotelContext, getSeasonalRules);
  router.post('/', getHotelContext, createSeasonRule);
  router.put('/:id', getHotelContext, updateSeasonRule);
  router.delete('/:id', getHotelContext, deleteSeasonRule);
  router.post('/:id/assign-room-types', getHotelContext, assignSeasonRuleToRoomType);

  return router;
};

