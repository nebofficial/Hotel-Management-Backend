const express = require('express');
const {
  getTodayCheckins,
  getTodayCheckouts,
  processQuickCheckin,
  processQuickCheckout,
} = require('../controllers/todayActivityController');

module.exports = function createTodayActivityRoutes(getHotelContext) {
  const router = express.Router({ mergeParams: true });

  router.get('/checkins', getHotelContext, getTodayCheckins);
  router.get('/checkouts', getHotelContext, getTodayCheckouts);
  router.post('/checkins/:id/quick', getHotelContext, processQuickCheckin);
  router.post('/checkouts/:id/quick', getHotelContext, processQuickCheckout);

  return router;
};

