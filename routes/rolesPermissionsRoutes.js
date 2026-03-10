const express = require('express');
const {
  fetchRoles,
  createRole,
  updateRole,
  assignPermissions,
  assignRoleToStaff,
  fetchPermissionLogs,
  exportRolesReport,
} = require('../controllers/rolesPermissionsController');

/**
 * Roles & permissions routes for a specific hotel.
 * Mounted under `/api/hotel-data/:hotelId/roles-permissions`.
 */
module.exports = function createRolesPermissionsRoutes(getHotelContext) {
  const router = express.Router({ mergeParams: true });

  router.get('/roles', getHotelContext, fetchRoles);
  router.post('/roles', getHotelContext, createRole);
  router.put('/roles/:roleId', getHotelContext, updateRole);
  router.post('/roles/:roleId/permissions', getHotelContext, assignPermissions);

  router.post('/assign-role', getHotelContext, assignRoleToStaff);
  router.get('/logs', getHotelContext, fetchPermissionLogs);
  router.get('/export', getHotelContext, exportRolesReport);

  return router;
};

