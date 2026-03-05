const express = require('express');
const {
  createCorporateAccount,
  fetchCorporateAccounts,
  generateCorporateInvoice,
  generateBulkInvoices,
  fetchOutstandingPayments,
  downloadStatement,
} = require('../controllers/corporateBillingController');

const createCorporateBillingRoutes = () => {
  const router = express.Router({ mergeParams: true });

  router.post('/accounts', createCorporateAccount);
  router.get('/accounts', fetchCorporateAccounts);

  router.post('/invoices', generateCorporateInvoice);
  router.post('/invoices/bulk', generateBulkInvoices);

  router.get('/outstanding', fetchOutstandingPayments);
  router.get('/statement', downloadStatement);

  return router;
};

module.exports = createCorporateBillingRoutes;

