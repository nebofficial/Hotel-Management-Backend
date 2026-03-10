const express = require('express');
const {
  fetchSalaryStructure,
  setupSalaryStructure,
  fetchAllowanceTypes,
  fetchStaffAllowances,
  upsertStaffAllowance,
  fetchDeductionTypes,
  fetchStaffDeductions,
  upsertStaffDeduction,
  addBonus,
  generatePayroll,
  fetchPayrollList,
  markPayrollPaid,
  fetchPaymentHistory,
  fetchPayrollReports,
  fetchStaffForPayroll,
} = require('../controllers/payrollController');

module.exports = function createPayrollRoutes(getHotelContext) {
  const router = express.Router({ mergeParams: true });

  router.get('/staff', getHotelContext, fetchStaffForPayroll);
  router.get('/salary-structure', getHotelContext, fetchSalaryStructure);
  router.post('/salary-structure', getHotelContext, setupSalaryStructure);

  router.get('/allowance-types', getHotelContext, fetchAllowanceTypes);
  router.get('/allowances', getHotelContext, fetchStaffAllowances);
  router.post('/allowances', getHotelContext, upsertStaffAllowance);

  router.get('/deduction-types', getHotelContext, fetchDeductionTypes);
  router.get('/deductions', getHotelContext, fetchStaffDeductions);
  router.post('/deductions', getHotelContext, upsertStaffDeduction);

  router.post('/bonus', getHotelContext, addBonus);

  router.post('/generate', getHotelContext, generatePayroll);
  router.get('/list', getHotelContext, fetchPayrollList);
  router.post('/entries/:entryId/paid', getHotelContext, markPayrollPaid);

  router.get('/payment-history', getHotelContext, fetchPaymentHistory);
  router.get('/reports', getHotelContext, fetchPayrollReports);

  return router;
};
