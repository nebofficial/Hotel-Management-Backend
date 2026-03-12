const { Op } = require('sequelize');
const { computeRange } = require('./kpiCalculator');

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

async function buildRevenueTrend({ RoomBill, period, startDate, endDate }) {
  const { rangeStart, rangeEnd } = computeRange({ period, startDate, endDate });

  const bills = await RoomBill.findAll({
    where: {
      status: { [Op.in]: ['SETTLED', 'PENDING'] },
      createdAt: { [Op.between]: [rangeStart, rangeEnd] },
    },
  }).catch(() => []);

  const byDate = {};
  bills.forEach((b) => {
    const d = (b.createdAt || b.checkOut || rangeStart).toISOString().slice(0, 10);
    byDate[d] = (byDate[d] || 0) + parseFloat(b.grandTotal || 0);
  });

  const dates = [];
  const cursor = startOfDay(rangeStart);
  while (cursor <= rangeEnd) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }

  const trend = dates.map((d) => ({
    date: d,
    revenue: byDate[d] || 0,
  }));

  return { trend, rangeStart, rangeEnd };
}

async function buildOccupancyTrend({ Room, period, startDate, endDate }) {
  const { rangeStart, rangeEnd } = computeRange({ period, startDate, endDate });

  const dates = [];
  const cursor = startOfDay(rangeStart);
  while (cursor <= rangeEnd) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  const totalRooms = await Room.count().catch(() => 0);

  const trend = [];
  for (const d of dates) {
    // Simple approximation: current occupancy snapshot reused for each day
    const occupiedRooms = await Room.count({ where: { status: 'occupied' } }).catch(() => 0);
    const rate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
    trend.push({
      date: d.toISOString().slice(0, 10),
      occupancyRate: rate,
    });
  }

  return { trend, rangeStart, rangeEnd, totalRooms };
}

module.exports = {
  buildRevenueTrend,
  buildOccupancyTrend,
};

