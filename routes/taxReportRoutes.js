const express = require('express');
const {
  getTaxSummary,
  getGSTVATReport,
  getServiceChargeReport,
  getTaxBreakdownByInvoice,
  getTaxFilingReport,
  getTaxTrend,
  exportTaxReport,
} = require('../controllers/taxReportController');

module.exports = function createTaxReportRoutes(getHotelContext) {
  const router = express.Router({ mergeParams: true });

  router.get('/summary', getHotelContext, getTaxSummary);
  router.get('/gst-vat', getHotelContext, getGSTVATReport);
  router.get('/service-charge', getHotelContext, getServiceChargeReport);
  router.get('/breakdown', getHotelContext, getTaxBreakdownByInvoice);
  router.get('/filing', getHotelContext, getTaxFilingReport);
  router.get('/trend', getHotelContext, getTaxTrend);
  router.get('/export', getHotelContext, exportTaxReport);

  return router;
};
