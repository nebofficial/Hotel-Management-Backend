const express = require('express');
const { body, validationResult } = require('express-validator');
const controller = require('../controllers/combinedBillController');

/**
 * Combined bills routes - mounted under /api/hotel-data/:hotelId/combined-bills
 */
module.exports = function createCombinedBillRoutes(getHotelContext) {
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

  // Guest folio snapshot
  router.get('/folio', getHotelContext, controller.fetchGuestFolio);

  // Add other charges (spa / laundry / misc)
  router.post(
    '/other-charges',
    getHotelContext,
    [
      body('bookingId').notEmpty().withMessage('bookingId is required'),
      body('guestId').notEmpty().withMessage('guestId is required'),
      body('items').isArray({ min: 1 }).withMessage('items must be an array'),
    ],
    validate,
    controller.addOtherCharges,
  );

  // Calculate final bill summary (server-side check)
  router.post(
    '/calculate',
    getHotelContext,
    [body('folio').notEmpty().withMessage('folio is required')],
    validate,
    controller.calculateFinalBill,
  );

  // Apply advance / credit adjustment
  router.post(
    '/apply-advance',
    getHotelContext,
    [
      body('bookingId').notEmpty().withMessage('bookingId is required'),
      body('guestId').notEmpty().withMessage('guestId is required'),
      body('amount').isFloat({ min: 0 }).withMessage('amount must be >= 0'),
    ],
    validate,
    controller.applyAdvance,
  );

  // Settle combined bill (multi-mode payment)
  router.post(
    '/settle',
    getHotelContext,
    [
      body('bookingId').notEmpty().withMessage('bookingId is required'),
      body('guestId').notEmpty().withMessage('guestId is required'),
      body('guestName').notEmpty().withMessage('guestName is required'),
      body('payments').isArray({ min: 1 }).withMessage('payments are required'),
    ],
    validate,
    controller.settleCombinedBill,
  );

  // Generate final unified invoice payload
  router.post(
    '/invoice',
    getHotelContext,
    [
      body('bookingId').notEmpty().withMessage('bookingId is required'),
      body('folio').notEmpty().withMessage('folio is required'),
    ],
    validate,
    controller.generateFinalInvoice,
  );

  return router;
};

