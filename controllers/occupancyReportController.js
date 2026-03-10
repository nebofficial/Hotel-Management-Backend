const { Op } = require('sequelize');
const { getOccupancyRate } = require('../utils/occupancyCalculator');

function parseDateRange(req) {
  const start = req.query.startDate || null;
  const end = req.query.endDate || null;
  const endDate = end ? new Date(end) : new Date();
  const startDate = start ? new Date(start) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { startDate: startDate.toISOString().slice(0, 10), endDate: endDate.toISOString().slice(0, 10) };
}

async function countOccupiedOnDate(Booking, dateStr) {
  return Booking.count({
    where: {
      status: { [Op.in]: ['confirmed', 'checked_in'] },
      checkIn: { [Op.lte]: new Date(dateStr + 'T23:59:59') },
      checkOut: { [Op.gte]: new Date(dateStr) },
    },
  });
}

exports.getDailyOccupancy = async (req, res) => {
  try {
    const { Room, Booking } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);
    const roomType = req.query.roomType || null;

    const rooms = await Room.findAll({ where: { status: { [Op.ne]: 'maintenance' } } });
    const totalRooms = roomType
      ? rooms.filter((r) => (r.roomType || '').toLowerCase() === (roomType || '').toLowerCase()).length
      : rooms.length;

    const daily = [];
    for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().slice(0, 10);
      let occupied = await countOccupiedOnDate(Booking, dateStr);
      if (roomType) {
        const activeBookings = await Booking.findAll({
          where: {
            status: { [Op.in]: ['confirmed', 'checked_in'] },
            roomType: roomType,
            checkIn: { [Op.lte]: new Date(dateStr + 'T23:59:59') },
            checkOut: { [Op.gte]: new Date(dateStr) },
          },
        });
        occupied = activeBookings.length;
      }
      const available = Math.max(0, totalRooms - occupied);
      daily.push({
        date: dateStr,
        roomsAvailable: available,
        roomsOccupied: occupied,
        totalRooms,
        occupancyPercentage: getOccupancyRate(occupied, totalRooms),
      });
    }

    res.json({ daily, totalRooms });
  } catch (error) {
    console.error('getDailyOccupancy error:', error);
    res.status(500).json({ message: 'Failed to load daily occupancy', error: error.message });
  }
};

exports.getWeeklyOccupancy = async (req, res) => {
  try {
    const { Room, Booking } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);

    const rooms = await Room.findAll({ where: { status: { [Op.ne]: 'maintenance' } } });
    const totalRooms = rooms.length;

    const weekMap = {};
    for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().slice(0, 10);
      const wkStart = new Date(d);
      wkStart.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1));
      const key = wkStart.toISOString().slice(0, 10);
      if (!weekMap[key]) weekMap[key] = { weekStart: key, bookings: 0, roomNights: 0 };
      const occupied = await countOccupiedOnDate(Booking, dateStr);
      weekMap[key].roomNights += occupied;
      weekMap[key].bookings += occupied > 0 ? 1 : 0;
    }

    const weekly = Object.values(weekMap).map((w) => {
      const weekEnd = new Date(w.weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const daysInWeek = 7;
      const possibleNights = totalRooms * daysInWeek;
      const avgOccupancy = possibleNights > 0 ? getOccupancyRate(w.roomNights, possibleNights) : 0;
      return {
        weekStart: w.weekStart,
        weekEnd: weekEnd.toISOString().slice(0, 10),
        totalBookings: w.bookings,
        roomNightsSold: w.roomNights,
        averageOccupancyRate: avgOccupancy,
        totalRooms,
      };
    });
    weekly.sort((a, b) => a.weekStart.localeCompare(b.weekStart));

    res.json({ weekly, totalRooms });
  } catch (error) {
    console.error('getWeeklyOccupancy error:', error);
    res.status(500).json({ message: 'Failed to load weekly occupancy', error: error.message });
  }
};

exports.getMonthlyOccupancy = async (req, res) => {
  try {
    const { Room, Booking } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);

    const rooms = await Room.findAll({ where: { status: { [Op.ne]: 'maintenance' } } });
    const totalRooms = rooms.length;

    const monthMap = {};
    for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().slice(0, 10);
      const key = dateStr.slice(0, 7);
      if (!monthMap[key]) monthMap[key] = { month: key, roomNights: 0 };
      const occupied = await countOccupiedOnDate(Booking, dateStr);
      monthMap[key].roomNights += occupied;
    }

    const monthly = Object.entries(monthMap).map(([key, v]) => {
      const [y, m] = key.split('-').map(Number);
      const daysInMonth = new Date(y, m, 0).getDate();
      const possibleNights = totalRooms * daysInMonth;
      const occupancyPct = possibleNights > 0 ? getOccupancyRate(v.roomNights, possibleNights) : 0;
      return {
        month: key,
        monthLabel: new Date(y, m - 1).toLocaleString('default', { month: 'long', year: 'numeric' }),
        roomNightsSold: v.roomNights,
        occupancyPercentage: occupancyPct,
        totalRooms,
        possibleNights,
      };
    });
    monthly.sort((a, b) => a.month.localeCompare(b.month));

    res.json({ monthly, totalRooms });
  } catch (error) {
    console.error('getMonthlyOccupancy error:', error);
    res.status(500).json({ message: 'Failed to load monthly occupancy', error: error.message });
  }
};

exports.getRoomTypeOccupancy = async (req, res) => {
  try {
    const { Room, Booking } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);

    const rooms = await Room.findAll({ where: { status: { [Op.ne]: 'maintenance' } } });
    const typeCount = {};
    rooms.forEach((r) => {
      const t = r.roomType || 'Unknown';
      typeCount[t] = (typeCount[t] || 0) + 1;
    });

    const typeRoomNights = {};
    for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().slice(0, 10);
      const bookings = await Booking.findAll({
        where: {
          status: { [Op.in]: ['confirmed', 'checked_in'] },
          checkIn: { [Op.lte]: new Date(dateStr + 'T23:59:59') },
          checkOut: { [Op.gte]: new Date(dateStr) },
        },
      });
      const byType = {};
      bookings.forEach((b) => {
        const t = b.roomType || 'Unknown';
        byType[t] = (byType[t] || 0) + 1;
      });
      Object.entries(byType).forEach(([t, c]) => {
        typeRoomNights[t] = (typeRoomNights[t] || 0) + c;
      });
    }

    const days = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (24 * 60 * 60 * 1000)) + 1);
    const roomTypeOccupancy = Object.keys(typeCount).map((type) => {
      const total = typeCount[type];
      const roomNights = typeRoomNights[type] || 0;
      const possibleNights = total * days;
      const occupancyPct = possibleNights > 0 ? getOccupancyRate(roomNights, possibleNights) : 0;
      return {
        roomType: type,
        totalRooms: total,
        roomNightsSold: roomNights,
        occupancyPercentage: occupancyPct,
        possibleNights,
      };
    });
    roomTypeOccupancy.sort((a, b) => (b.occupancyPercentage || 0) - (a.occupancyPercentage || 0));

    res.json({ roomTypeOccupancy, periodDays: days });
  } catch (error) {
    console.error('getRoomTypeOccupancy error:', error);
    res.status(500).json({ message: 'Failed to load room type occupancy', error: error.message });
  }
};

exports.getOccupancySummary = async (req, res) => {
  try {
    const { Room, Booking } = req.hotelModels;
    const today = new Date().toISOString().slice(0, 10);

    const rooms = await Room.findAll({ where: { status: { [Op.ne]: 'maintenance' } } });
    const totalRooms = rooms.length;
    const occupied = await countOccupiedOnDate(Booking, today);
    const available = Math.max(0, totalRooms - occupied);
    const occupancyRate = getOccupancyRate(occupied, totalRooms);

    res.json({
      totalRooms,
      roomsOccupiedToday: occupied,
      roomsAvailableToday: available,
      occupancyRateToday: occupancyRate,
      date: today,
    });
  } catch (error) {
    console.error('getOccupancySummary error:', error);
    res.status(500).json({ message: 'Failed to load occupancy summary', error: error.message });
  }
};

exports.exportOccupancyReport = async (req, res) => {
  try {
    const { Room, Booking } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);
    const roomType = req.query.roomType || null;

    const rooms = await Room.findAll({ where: { status: { [Op.ne]: 'maintenance' } } });
    const totalRooms = roomType
      ? rooms.filter((r) => (r.roomType || '').toLowerCase() === (roomType || '').toLowerCase()).length
      : rooms.length;

    const daily = [];
    for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().slice(0, 10);
      let occupied = await countOccupiedOnDate(Booking, dateStr);
      if (roomType) {
        const active = await Booking.findAll({
          where: {
            status: { [Op.in]: ['confirmed', 'checked_in'] },
            roomType: roomType,
            checkIn: { [Op.lte]: new Date(dateStr + 'T23:59:59') },
            checkOut: { [Op.gte]: new Date(dateStr) },
          },
        });
        occupied = active.length;
      }
      daily.push({
        date: dateStr,
        roomsAvailable: Math.max(0, totalRooms - occupied),
        roomsOccupied: occupied,
        totalRooms,
        occupancyPercentage: getOccupancyRate(occupied, totalRooms),
      });
    }

    const monthMap = {};
    daily.forEach((row) => {
      const key = row.date.slice(0, 7);
      if (!monthMap[key]) monthMap[key] = { roomNights: 0 };
      monthMap[key].roomNights += row.roomsOccupied;
    });

    const monthly = Object.entries(monthMap).map(([key, v]) => {
      const [y, m] = key.split('-').map(Number);
      const daysInMonth = new Date(y, m, 0).getDate();
      const possibleNights = totalRooms * daysInMonth;
      return {
        month: key,
        monthLabel: new Date(y, m - 1).toLocaleString('default', { month: 'long', year: 'numeric' }),
        roomNightsSold: v.roomNights,
        occupancyPercentage: possibleNights > 0 ? getOccupancyRate(v.roomNights, possibleNights) : 0,
      };
    });

    const today = new Date().toISOString().slice(0, 10);
    const occupiedToday = await countOccupiedOnDate(Booking, today);

    res.json({
      summary: {
        totalRooms,
        roomsOccupiedToday: occupiedToday,
        roomsAvailableToday: Math.max(0, totalRooms - occupiedToday),
        occupancyRateToday: getOccupancyRate(occupiedToday, totalRooms),
        date: today,
      },
      daily,
      monthly,
      filters: { startDate, endDate, roomType },
    });
  } catch (error) {
    console.error('exportOccupancyReport error:', error);
    res.status(500).json({ message: 'Failed to export occupancy report', error: error.message });
  }
};
