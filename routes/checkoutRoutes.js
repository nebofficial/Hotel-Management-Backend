const express = require('express');
const { body, validationResult } = require('express-validator');
const controller = require('../controllers/checkoutController');

/**
 * Factory to create checkout routes.
 * Mounted under `/api/hotel-data/:hotelId/checkout`.
 */
module.exports = function createCheckoutRoutes(getHotelContext) {
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

  router.get('/stay', getHotelContext, controller.getStaySummary);

  router.post(
    '/final-bill',
    getHotelContext,
    [body('bookingId').notEmpty().withMessage('bookingId is required')],
    validate,
    controller.generateFinalBill
  );

  router.post(
    '/pending-charge',
    getHotelContext,
    [
      body('bookingId').notEmpty().withMessage('bookingId is required'),
      body('item').notEmpty().withMessage('item is required'),
    ],
    validate,
    controller.addPendingCharge
  );

  router.post(
    '/process-payment',
    getHotelContext,
    [
      body('bookingId').notEmpty().withMessage('bookingId is required'),
      body('payments').isArray({ min: 1 }).withMessage('payments array is required'),
    ],
    validate,
    controller.processPayment
  );

  router.post(
    '/close-stay',
    getHotelContext,
    [body('bookingId').notEmpty().withMessage('bookingId is required')],
    validate,
    controller.closeStay
  );

  router.post('/send-invoice', getHotelContext, controller.sendInvoice);

  return router;
};

