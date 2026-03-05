const express = require('express');
const { body, validationResult } = require('express-validator');
const controller = require('../controllers/cancellationController');

/**
 * Factory to create cancellation routes.
 * Mounted under `/api/hotel-data/:hotelId/cancellations`.
 */
module.exports = function createCancellationRoutes(getHotelContext) {
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
    '/calculate-fee',
    getHotelContext,
    [body('bookingId').notEmpty().withMessage('bookingId is required')],
    validate,
    controller.calculateCancellationFee
  );

  router.post(
    '/cancel',
    getHotelContext,
    [body('bookingId').notEmpty().withMessage('bookingId is required')],
    validate,
    controller.cancelReservation
  );

  router.post(
    '/refund',
    getHotelContext,
    [body('bookingId').notEmpty().withMessage('bookingId is required')],
    validate,
    controller.processRefund
  );

  router.post(
    '/no-show',
    getHotelContext,
    [body('bookingId').notEmpty().withMessage('bookingId is required')],
    validate,
    controller.markNoShow
  );

  return router;
};

