const express = require('express');
const { body, validationResult } = require('express-validator');
const controller = require('../controllers/reservationController');

/**
 * Factory to create reservation routes with access to getHotelContext middleware.
 * Mounted under `/api/hotel-data/:hotelId/reservations`.
 */
module.exports = function createReservationRoutes(getHotelContext) {
  const router = express.Router({ mergeParams: true });

  const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  };

  router.get('/', getHotelContext, controller.listReservations);

  router.get('/next-number', getHotelContext, controller.nextReservationNumber);

  router.post(
    '/availability',
    getHotelContext,
    [
      body('checkIn').isISO8601().withMessage('checkIn must be a valid date'),
      body('checkOut').isISO8601().withMessage('checkOut must be a valid date'),
      body('roomType').optional().isString(),
    ],
    validate,
    controller.checkAvailability
  );

  router.post(
    '/pricing',
    getHotelContext,
    [
      body('checkIn').isISO8601(),
      body('checkOut').isISO8601(),
      body('guests').optional().isInt({ min: 1 }),
      body('roomType').optional().isString(),
      body('roomId').optional().isString(),
      body('ratePlan').optional().isString(),
    ],
    validate,
    controller.pricingQuote
  );

  router.post(
    '/',
    getHotelContext,
    [
      body('checkIn').isISO8601(),
      body('checkOut').isISO8601(),
      body('numberOfGuests').optional().isInt({ min: 1 }),
      body('roomType').optional().isString(),
      body('roomId').optional().isString(),
      body('ratePlan').optional().isString(),
      body('guest').optional().isObject(),
      body('specialRequests').optional().isString(),
      body('extras').optional().isObject(),
      body('payment').optional().isObject(),
      body('confirm').optional().isBoolean(),
    ],
    validate,
    controller.createReservation
  );

  router.get(
    '/:bookingId',
    getHotelContext,
    controller.getReservation
  );

  router.patch(
    '/:bookingId',
    getHotelContext,
    [
      body('checkIn').optional().isISO8601(),
      body('checkOut').optional().isISO8601(),
      body('roomType').optional().isString(),
      body('roomId').optional().isString(),
      body('ratePlan').optional().isString(),
      body('guest').optional().isObject(),
      body('extras').optional().isObject(),
      body('specialRequests').optional().isString(),
      body('status').optional().isString(),
    ],
    validate,
    controller.updateReservation
  );

  router.post(
    '/:bookingId/cancel',
    getHotelContext,
    [
      body('reason').optional().isString(),
      body('markNoShow').optional().isBoolean(),
    ],
    validate,
    controller.cancelReservation
  );

  router.post(
    '/:bookingId/collect-advance',
    getHotelContext,
    [body('amount').isNumeric(), body('mode').optional().isString()],
    validate,
    controller.collectAdvance
  );

  return router;
};

