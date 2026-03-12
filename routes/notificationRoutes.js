const express = require('express');
const {
  getNotifications,
  markNotificationRead,
  getLowAvailabilityAlerts,
  getPaymentAlerts,
  getMaintenanceAlerts,
} = require('../controllers/notificationController');

module.exports = function createNotificationRoutes(getHotelContext) {
  const router = express.Router({ mergeParams: true });

  router.get('/', getHotelContext, getNotifications);
  router.patch('/:id/read', getHotelContext, markNotificationRead);

  router.get('/low-availability', getHotelContext, getLowAvailabilityAlerts);
  router.get('/payments', getHotelContext, getPaymentAlerts);
  router.get('/maintenance', getHotelContext, getMaintenanceAlerts);

  return router;
};

