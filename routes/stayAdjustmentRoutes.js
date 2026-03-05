const express = require('express');
const { body, validationResult } = require('express-validator');
const controller = require('../controllers/stayAdjustmentController');

/**
 * Factory to create stay adjustment routes.
 * Mounted under `/api/hotel-data/:hotelId/stay-adjustments`.
 */
module.exports = function createStayAdjustmentRoutes(getHotelContext) {
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

  router.get('/stay', getHotelContext, controller.getStay);

  router.post(
    '/calculate',
    getHotelContext,
    [body('bookingId').notEmpty().withMessage('bookingId is required')],
    validate,
    controller.calculateCharge
  );

  router.post(
    '/request-approval',
    getHotelContext,
    [body('bookingId').notEmpty().withMessage('bookingId is required')],
    validate,
    controller.requestApproval
  );

  router.post(
    '/apply-charge',
    getHotelContext,
    [body('bookingId').notEmpty().withMessage('bookingId is required')],
    validate,
    controller.applyCharge
  );

  router.post('/notify-housekeeping', getHotelContext, controller.notifyHousekeeping);

  return router;
};

