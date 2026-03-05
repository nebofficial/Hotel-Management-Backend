const express = require('express');
const { body, validationResult } = require('express-validator');
const controller = require('../controllers/groupBookingController');

/**
 * Factory to create group booking routes with access to getHotelContext middleware.
 * Mounted under `/api/hotel-data/:hotelId/group-bookings`.
 */
module.exports = function createGroupBookingRoutes(getHotelContext) {
  const router = express.Router({ mergeParams: true });

  const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const arr = errors.array();
      const msg = arr[0]?.msg || arr.map((e) => e.msg).join('; ') || 'Validation failed';
      return res.status(400).json({ message: msg, errors: arr });
    }
    next();
  };

  router.get('/next-id', getHotelContext, controller.nextMasterGroupId);

  router.post(
    '/block-rooms',
    getHotelContext,
    [
      body('checkIn').isISO8601(),
      body('checkOut').isISO8601(),
      body('roomBlocks').isArray(),
    ],
    validate,
    controller.blockRooms
  );

  router.post(
    '/apply-discount',
    getHotelContext,
    [
      body('checkIn').isISO8601(),
      body('checkOut').isISO8601(),
      body('ratePerNight').optional().isNumeric(),
      body('totalRooms').optional().isInt({ min: 0 }),
      body('discountPercent').optional().isNumeric(),
      body('discountFlat').optional().isNumeric(),
    ],
    validate,
    controller.applyGroupDiscount
  );

  router.post(
    '/',
    getHotelContext,
    [
      body('groupName').trim().notEmpty().withMessage('Group name is required'),
      body('contactName').trim().notEmpty().withMessage('Contact name is required'),
      body('contactPhone').trim().notEmpty().withMessage('Contact phone is required'),
      body('checkIn')
        .trim()
        .notEmpty()
        .withMessage('Check-in date is required')
        .custom((v) => {
          const d = new Date(v);
          if (Number.isNaN(d.getTime())) return false;
          return true;
        })
        .withMessage('Check-in must be a valid date'),
      body('checkOut')
        .trim()
        .notEmpty()
        .withMessage('Check-out date is required')
        .custom((v) => {
          const d = new Date(v);
          if (Number.isNaN(d.getTime())) return false;
          return true;
        })
        .withMessage('Check-out must be a valid date'),
      body('roomBlocks').optional().isArray(),
      body('guestList').optional().isArray(),
      body('billingMode').optional().isString(),
      body('advancePaid').optional().isNumeric(),
      body('confirm').optional().isBoolean(),
    ],
    validate,
    controller.createGroupBooking
  );

  router.get('/', getHotelContext, controller.listGroupBookings);

  router.get('/:groupId', getHotelContext, controller.getGroupBooking);

  return router;
};

