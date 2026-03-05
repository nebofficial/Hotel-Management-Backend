const express = require('express');
const { body, validationResult } = require('express-validator');
const controller = require('../controllers/restaurantBillController');

/**
 * Restaurant bill routes - mounted under /api/hotel-data/:hotelId/restaurant-bills
 */
module.exports = function createRestaurantBillRoutes(getHotelContext) {
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

  router.get('/stats', getHotelContext, controller.getStats);
  router.get('/next-number', getHotelContext, controller.getNextBillNumber);
  router.get('/', getHotelContext, controller.listBills);
  router.post(
    '/',
    getHotelContext,
    [
      body('orderType').optional().isIn(['Dine-in', 'Takeaway', 'Delivery']),
      body('tableNo').optional().isString(),
      body('items').optional().isArray(),
    ],
    validate,
    controller.createBill
  );
  router.get('/:id', getHotelContext, controller.getBill);
  router.post(
    '/:id/add-item',
    getHotelContext,
    [body('item').isObject().withMessage('item is required'), body('item.id').notEmpty(), body('item.name').notEmpty()],
    validate,
    controller.addItemToBill
  );
  router.post(
    '/:id/apply-discount',
    getHotelContext,
    [body('discountAmount').optional().isFloat({ min: 0 }), body('discountPercent').optional().isFloat({ min: 0, max: 100 })],
    validate,
    controller.applyDiscount
  );
  router.post('/:id/generate-kot', getHotelContext, controller.generateKOT);
  router.post(
    '/:id/settle',
    getHotelContext,
    [body('payments').optional().isArray(), body('paymentMode').optional().isString()],
    validate,
    controller.settleBill
  );
  router.post(
    '/:id/refund',
    getHotelContext,
    [
      body('refundAmount').optional().isFloat({ min: 0 }),
      body('reason').optional().isString(),
      body('refundMode').optional().isString(),
    ],
    validate,
    controller.processRefund
  );
  router.post('/:id/cancel', getHotelContext, controller.cancelBill);

  return router;
};
