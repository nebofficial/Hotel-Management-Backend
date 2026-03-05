const express = require('express');
const { body, validationResult } = require('express-validator');
const controller = require('../controllers/creditNoteController');

module.exports = function createCreditNoteRoutes(getHotelContext) {
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

  router.get('/invoices', getHotelContext, controller.fetchInvoiceDetails);

  router.post(
    '/create',
    getHotelContext,
    [body('invoiceId').notEmpty(), body('amount').isFloat({ min: 0.01 })],
    validate,
    controller.createCreditNote,
  );

  router.post(
    '/apply',
    getHotelContext,
    [body('creditNoteId').notEmpty(), body('bookingId').notEmpty(), body('amount').isFloat({ min: 0.01 })],
    validate,
    controller.applyCredit,
  );

  router.get('/outstanding', getHotelContext, controller.fetchOutstandingCredits);

  router.get('/expiry', getHotelContext, controller.trackCreditExpiry);

  router.post(
    '/pdf',
    getHotelContext,
    [body('creditNoteId').notEmpty()],
    validate,
    controller.generateCreditNotePDF,
  );

  return router;
};

