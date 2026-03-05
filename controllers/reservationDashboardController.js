const { computeRange, buildReservationDashboard } = require('../utils/reservationKPIService')

exports.getReservationDashboard = async (req, res) => {
  try {
    const { Booking } = req.hotelModels
    await Booking.sync().catch(() => {})

    const { rangeStart, rangeEnd } = computeRange({
      period: req.query.period,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    })

    const data = await buildReservationDashboard({ Booking, rangeStart, rangeEnd })

    res.json({
      startDate: rangeStart.toISOString(),
      endDate: rangeEnd.toISOString(),
      ...data,
    })
  } catch (error) {
    console.error('Reservation dashboard error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

