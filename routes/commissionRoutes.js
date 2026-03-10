const express = require('express');
const {
  fetchCommissionRules,
  createCommissionRule,
  assignCommissionToStaff,
  calculateCommission,
  fetchCommissionList,
  updateCommissionPayout,
  fetchCommissionReports,
} = require('../controllers/commissionController');

/**
 * Commission routes for a specific hotel.
 * Mounted under `/api/hotel-data/:hotelId/commission`.
 */
module.exports = function createCommissionRoutes(getHotelContext) {
  const router = express.Router({ mergeParams: true });

  router.get('/rules', getHotelContext, fetchCommissionRules);
  router.post('/rules', getHotelContext, createCommissionRule);
  router.post('/assign-staff', getHotelContext, assignCommissionToStaff);
  router.post('/calculate', getHotelContext, calculateCommission);
  router.get('/list', getHotelContext, fetchCommissionList);
  router.post('/transactions/:id/payout', getHotelContext, updateCommissionPayout);
  router.get('/reports', getHotelContext, fetchCommissionReports);

  return router;
};

