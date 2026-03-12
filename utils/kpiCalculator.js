const { Op } = require('sequelize');

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function computeRange({ period, startDate, endDate }) {
  const now = new Date();
  const p = String(period || 'today');

  if (startDate && endDate) {
    return {
      rangeStart: startOfDay(new Date(startDate)),
      rangeEnd: endOfDay(new Date(endDate)),
    };
  }

  if (p === 'today') {
    return { rangeStart: startOfDay(now), rangeEnd: endOfDay(now) };
  }

  if (p === 'weekly') {
    const s = new Date(now);
    s.setDate(s.getDate() - 6);
    return { rangeStart: startOfDay(s), rangeEnd: endOfDay(now) };
  }

  if (p === 'monthly') {
    const s = new Date(now.getFullYear(), now.getMonth(), 1);
    return { rangeStart: startOfDay(s), rangeEnd: endOfDay(now) };
  }

  const s = new Date(now);
  s.setDate(s.getDate() - 29);
  return { rangeStart: startOfDay(s), rangeEnd: endOfDay(now) };
}

async function computeOverviewKpis({ RoomBill, Room, Booking, period, startDate, endDate }) {
  const { rangeStart, rangeEnd } = computeRange({ period, startDate, endDate });

  // Revenue in current period
  const billWhere = {
    status: { [Op.in]: ['SETTLED', 'PENDING'] },
    createdAt: { [Op.between]: [rangeStart, rangeEnd] },
  };

  const bills = await RoomBill.findAll({ where: billWhere }).catch(() => []);
  let totalRevenue = 0;
  bills.forEach((b) => {
    totalRevenue += parseFloat(b.grandTotal || 0);
  });

  // Revenue in previous, same-length period
  const ms = rangeEnd.getTime() - rangeStart.getTime();
  const prevEnd = new Date(rangeStart.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - ms);
  const prevBills = await RoomBill.findAll({
    where: {
      status: { [Op.in]: ['SETTLED', 'PENDING'] },
      createdAt: { [Op.between]: [prevStart, prevEnd] },
    },
  }).catch(() => []);

  let prevRevenue = 0;
  prevBills.forEach((b) => {
    prevRevenue += parseFloat(b.grandTotal || 0);
  });

  const revenueGrowthPct =
    prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : null;

  // Room occupancy snapshot (current moment)
  const totalRooms = await Room.count().catch(() => 0);
  const occupiedRooms = await Room.count({ where: { status: 'occupied' } }).catch(() => 0);
  const availableRooms = await Room.count({ where: { status: 'available' } }).catch(() => 0);
  const maintenanceRooms = await Room.count({ where: { status: 'maintenance' } }).catch(
    () => 0,
  );

  const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

  // Check-ins today (or current range's last day)
  const todayStart = startOfDay(rangeEnd);
  const todayEnd = endOfDay(rangeEnd);
  const checkinsToday = await Booking.count({
    where: {
      status: 'checked_in',
      checkIn: { [Op.between]: [todayStart, todayEnd] },
    },
  }).catch(() => 0);

  return {
    period: period || 'today',
    rangeStart,
    rangeEnd,
    revenue: {
      total: totalRevenue,
      previous: prevRevenue,
      growthPct: revenueGrowthPct,
    },
  occupancy: {
      rate: occupancyRate,
      totalRooms,
      occupiedRooms,
      availableRooms,
      maintenanceRooms,
    },
    checkinsToday,
  };
}

module.exports = {
  computeRange,
  computeOverviewKpis,
};

