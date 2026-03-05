const express = require('express');
const { body, validationResult } = require('express-validator');
const controller = require('../controllers/refundController');

module.exports = function createRefundRoutes(getHotelContext) {
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

  router.get('/bills', getHotelContext, controller.fetchBillDetails);

  router.post(
    '/initiate',
    getHotelContext,
    [body('amount').isFloat({ min: 0.01 })],
    validate,
    controller.initiateRefund,
  );

  router.post(
    '/approve',
    getHotelContext,
    [body('refundId').notEmpty()],
    validate,
    controller.approveRefund,
  );

  router.post(
    '/process',
    getHotelContext,
    [body('refundId').notEmpty()],
    validate,
    controller.processRefund,
  );

  router.post(
    '/receipt',
    getHotelContext,
    [body('refundId').notEmpty()],
    validate,
    controller.generateRefundReceipt,
  );

  return router;
};

