const express = require('express');
const {
  getLoginActivity,
  getSystemChanges,
  getDataModificationLogs,
  getRolePermissionLogs,
  getTransactionLogs,
  exportAuditLogs,
} = require('../controllers/auditLogsController');

module.exports = function createAuditLogsRoutes(getHotelContext) {
  const router = express.Router({ mergeParams: true });

  router.get('/login-activity', getHotelContext, getLoginActivity);
  router.get('/system-changes', getHotelContext, getSystemChanges);
  router.get('/data-modifications', getHotelContext, getDataModificationLogs);
  router.get('/role-permissions', getHotelContext, getRolePermissionLogs);
  router.get('/transactions', getHotelContext, getTransactionLogs);
  router.get('/export', getHotelContext, exportAuditLogs);

  return router;
};

