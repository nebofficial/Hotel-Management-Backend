const express = require('express');
const { body, validationResult } = require('express-validator');
const controller = require('../controllers/advancePaymentController');

module.exports = function createAdvancePaymentRoutes(getHotelContext) {
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

  router.get('/history', getHotelContext, controller.getAdvanceHistory);

  router.post(
    '/collect',
    getHotelContext,
    [
      body('bookingId').notEmpty().withMessage('bookingId is required'),
      body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be > 0'),
      body('mode').optional().isString(),
    ],
    validate,
    controller.collectAdvance,
  );

  router.post(
    '/link',
    getHotelContext,
    [body('receiptNumber').notEmpty(), body('bookingId').notEmpty()],
    validate,
    controller.linkAdvanceToBooking,
  );

  router.post(
    '/adjust',
    getHotelContext,
    [
      body('receiptNumber').notEmpty(),
      body('bookingId').notEmpty(),
      body('amount').isFloat({ min: 0.01 }),
    ],
    validate,
    controller.adjustAdvance,
  );

  router.post(
    '/refund',
    getHotelContext,
    [
      body('receiptNumber').notEmpty(),
      body('amount').isFloat({ min: 0.01 }),
      body('mode').optional().isString(),
      body('managerApproved').optional().isBoolean(),
    ],
    validate,
    controller.refundAdvance,
  );

  return router;
};

