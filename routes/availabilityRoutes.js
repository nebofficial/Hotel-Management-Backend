const express = require('express');
const { body, validationResult } = require('express-validator');
const controller = require('../controllers/availabilityController');

/**
 * Factory to create availability calendar routes.
 * Mounted under `/api/hotel-data/:hotelId/availability-calendar`.
 */
module.exports = function createAvailabilityRoutes(getHotelContext) {
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

  // Calendar data
  router.get('/', getHotelContext, controller.getCalendarData);

  // Maintenance block
  router.post(
    '/block',
    getHotelContext,
    [
      body('roomId').notEmpty().withMessage('roomId is required'),
      body('startDate').notEmpty().withMessage('startDate is required'),
      body('endDate').notEmpty().withMessage('endDate is required'),
    ],
    validate,
    controller.blockRoom
  );

  router.post('/:blockId/release', getHotelContext, controller.releaseBlock);

  return router;
};

