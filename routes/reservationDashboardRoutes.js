const express = require('express')
const controller = require('../controllers/reservationDashboardController')

/**
 * Factory to create reservation dashboard routes with access to getHotelContext middleware.
 * Mounted under `/api/hotel-data/:hotelId/reservation-dashboard`.
 */
module.exports = function createReservationDashboardRoutes(getHotelContext) {
  const router = express.Router({ mergeParams: true })

  router.get('/', getHotelContext, controller.getReservationDashboard)

  return router
}

