const { Op } = require('sequelize')

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function endOfDay(d) {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

function computeRange({ period, startDate, endDate }) {
  const now = new Date()
  const p = String(period || 'monthly')
  if (startDate && endDate) return { rangeStart: new Date(startDate), rangeEnd: new Date(endDate) }
  if (p === 'today') return { rangeStart: startOfDay(now), rangeEnd: endOfDay(now) }
  if (p === 'weekly') {
    const s = new Date(now)
    s.setDate(s.getDate() - 7)
    return { rangeStart: startOfDay(s), rangeEnd: endOfDay(now) }
  }
  if (p === 'monthly') return { rangeStart: new Date(now.getFullYear(), now.getMonth(), 1), rangeEnd: endOfDay(now) }
  const s = new Date(now)
  s.setDate(s.getDate() - 30)
  return { rangeStart: startOfDay(s), rangeEnd: endOfDay(now) }
}

async function buildReservationDashboard({ Booking, rangeStart, rangeEnd }) {
  const dateFilter = { [Op.gte]: rangeStart, [Op.lte]: rangeEnd }

  const [totalReservations, pendingConfirmations, cancellationsToday] = await Promise.all([
    Booking.count({ where: { createdAt: dateFilter } }).catch(() => 0),
    Booking.count({ where: { status: 'pending', createdAt: dateFilter } }).catch(() => 0),
    Booking.count({ where: { status: 'cancelled', updatedAt: dateFilter } }).catch(() => 0),
  ])

  const pendingList = await Booking.findAll({
    where: { status: 'pending' },
    order: [['createdAt', 'DESC']],
    limit: 10,
  }).catch(() => [])

  const recent = await Booking.findAll({
    order: [['createdAt', 'DESC']],
    limit: 20,
  }).catch(() => [])

  // Chart: last 14 days bookings count
  const byDay = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const s = startOfDay(d)
    const e = endOfDay(d)
    byDay.push({ date: s.toISOString().slice(0, 10), start: s, end: e })
  }

  const createdIn14Days = await Booking.findAll({
    where: { createdAt: { [Op.gte]: byDay[0].start, [Op.lte]: byDay[byDay.length - 1].end } },
    attributes: ['status', 'createdAt'],
  }).catch(() => [])

  const chartData = byDay.map((b) => {
    const dayKey = b.date
    const rows = createdIn14Days.filter(
      (x) => x.createdAt && new Date(x.createdAt).toISOString().slice(0, 10) === dayKey,
    )
    const total = rows.length
    const confirmed = rows.filter((r) => r.status === 'confirmed').length
    const pending = rows.filter((r) => r.status === 'pending').length
    const cancelled = rows.filter((r) => r.status === 'cancelled').length
    return { date: dayKey, total, confirmed, pending, cancelled }
  })

  // Group bookings: placeholder (no groupId field in Booking model)
  const groupBookingsCount = 0

  return {
    kpis: {
      totalReservations,
      pendingConfirmations,
      groupBookings: groupBookingsCount,
      cancellationsToday,
    },
    pendingConfirmationsList: pendingList.map((b) => (b.toJSON ? b.toJSON() : b)),
    recentBookingActivity: recent.map((b) => (b.toJSON ? b.toJSON() : b)),
    chartData,
  }
}

module.exports = { computeRange, buildReservationDashboard }

