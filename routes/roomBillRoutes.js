const express = require('express');
const { body, validationResult } = require('express-validator');
const controller = require('../controllers/roomBillController');

/**
 * Factory to create room bill routes with access to getHotelContext middleware.
 * Mounted under `/api/hotel-data` router at `/:hotelId/room-bills`.
 */
module.exports = function createRoomBillRoutes(getHotelContext) {
  const router = express.Router({ mergeParams: true });

  // List
  router.get('/', getHotelContext, controller.listRoomBills);

  // Booking details for auto-fill
  router.get('/booking/:bookingId', getHotelContext, controller.getBookingDetails);

  // Create/Update draft (upsert)
  router.post(
    '/',
    getHotelContext,
    [
      body('bookingId').notEmpty(),
      body('pricePerNight').optional().isNumeric(),
      body('lateCheckoutCharge').optional().isNumeric(),
      body('extraBedCharge').optional().isNumeric(),
      body('extras').optional().isArray(),
      body('discountAmount').optional().isNumeric(),
      body('discountPercent').optional().isNumeric(),
      body('gstPercent').optional().isNumeric(),
      body('serviceChargePercent').optional().isNumeric(),
      body('advancePaid').optional().isNumeric(),
    ],
    async (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      return controller.createOrUpdateDraft(req, res, next);
    }
  );

  // Get single
  router.get('/:id', getHotelContext, controller.getRoomBill);

  // Settle (creates payments + marks settled)
  router.post(
    '/settle',
    getHotelContext,
    [body('bookingId').notEmpty(), body('guestId').notEmpty(), body('guestName').notEmpty(), body('payments').isArray({ min: 1 })],
    async (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      return controller.settleRoomBill(req, res, next);
    }
  );

  return router;
};

