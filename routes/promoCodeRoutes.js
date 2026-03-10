const express = require('express');
const {
  getPromoCodes,
  createPromoCode,
  updatePromoCode,
  togglePromoStatus,
  getPromoAnalytics,
  validatePromoCode,
} = require('../controllers/promoCodeController');

module.exports = function createPromoCodeRoutes(getHotelContext) {
  const router = express.Router({ mergeParams: true });

  router.get('/analytics', getHotelContext, getPromoAnalytics);
  router.get('/validate', getHotelContext, validatePromoCode);
  router.get('/', getHotelContext, getPromoCodes);
  router.post('/', getHotelContext, createPromoCode);
  router.put('/:id', getHotelContext, updatePromoCode);
  router.post('/:id/toggle-status', getHotelContext, togglePromoStatus);

  return router;
};
