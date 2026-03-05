const express = require('express');
const { body, validationResult } = require('express-validator');
const controller = require('../controllers/walkinController');

/**
 * Factory to create walk-in booking routes.
 * Mounted under `/api/hotel-data/:hotelId/walkins`.
 */
module.exports = function createWalkinRoutes(getHotelContext) {
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

  // Get next walk-in number
  router.get('/next-number', getHotelContext, controller.nextWalkinNumber);

  // Get available rooms for walk-in
  router.get('/available-rooms', getHotelContext, controller.getAvailableRooms);

  // Lookup guest by phone
  router.get('/lookup-guest', getHotelContext, controller.lookupGuest);

  // Calculate rate
  router.post(
    '/calculate-rate',
    getHotelContext,
    [
      body('checkOut').notEmpty().withMessage('Check-out date is required'),
      body('baseRoomRate').optional().isNumeric(),
      body('occupancyType').optional().isString(),
    ],
    validate,
    controller.calculateRate
  );

  // Create walk-in booking
  router.post(
    '/',
    getHotelContext,
    [
      body('guestName').trim().notEmpty().withMessage('Guest name is required'),
      body('guestPhone').trim().notEmpty().withMessage('Guest phone is required'),
      body('roomId').notEmpty().withMessage('Room selection is required'),
      body('expectedCheckOut').notEmpty().withMessage('Expected check-out is required'),
      body('numberOfGuests').optional().isInt({ min: 1 }),
      body('occupancyType').optional().isString(),
      body('paidAmount').optional().isNumeric(),
      body('paymentMode').optional().isString(),
    ],
    validate,
    controller.createWalkin
  );

  // List walk-ins
  router.get('/', getHotelContext, controller.listWalkins);

  // Get single walk-in
  router.get('/:walkinId', getHotelContext, controller.getWalkin);

  // Check out
  router.post('/:walkinId/checkout', getHotelContext, controller.checkoutWalkin);

  // Cancel
  router.post('/:walkinId/cancel', getHotelContext, controller.cancelWalkin);

  // Generate bill
  router.get('/:walkinId/bill', getHotelContext, controller.generateBill);

  // Generate registration card
  router.get('/:walkinId/registration-card', getHotelContext, controller.generateRegistrationCard);

  return router;
};
