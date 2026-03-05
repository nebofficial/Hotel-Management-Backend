const express = require('express');
const { body, validationResult } = require('express-validator');
const controller = require('../controllers/checkinController');

/**
 * Factory to create check-in routes with access to getHotelContext middleware.
 * Mounted under `/api/hotel-data/:hotelId/checkin`.
 */
module.exports = function createCheckinRoutes(getHotelContext) {
  const router = express.Router({ mergeParams: true });

  const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const arr = errors.array();
      const msg = arr[0]?.msg || 'Validation failed';
      return res.status(400).json({ message: msg, errors: arr });
    }
    next();
  };

  router.post(
    '/confirm-arrival',
    getHotelContext,
    [body('bookingId').notEmpty().withMessage('bookingId is required')],
    validate,
    controller.confirmArrival
  );

  router.post(
    '/assign-room',
    getHotelContext,
    [body('bookingId').notEmpty().withMessage('bookingId is required')],
    validate,
    controller.assignRoom
  );

  router.post(
    '/collect-deposit',
    getHotelContext,
    [
      body('bookingId').notEmpty().withMessage('bookingId is required'),
      body('amount').isNumeric().withMessage('amount must be numeric'),
    ],
    validate,
    controller.collectDeposit
  );

  router.post(
    '/activate-stay',
    getHotelContext,
    [body('bookingId').notEmpty().withMessage('bookingId is required')],
    validate,
    controller.activateStay
  );

  return router;
};

