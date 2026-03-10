const { Op } = require('sequelize');
const { calculateADR, calculateRevPAR } = require('../utils/adrRevparService');

function parseDateRange(req) {
  const start = req.query.startDate || null;
  const end = req.query.endDate || null;
  const endDate = end ? new Date(end) : new Date();
  const startDate = start ? new Date(start) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { startDate: startDate.toISOString().slice(0, 10), endDate: endDate.toISOString().slice(0, 10) };
}

exports.getRoomRevenueSummary = async (req, res) => {
  try {
    const { RoomBill, Room } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);
    const roomType = req.query.roomType || null;

    const rooms = await Room.findAll({ where: { status: { [Op.ne]: 'maintenance' } } });
    const roomMap = {};
    rooms.forEach((r) => { roomMap[r.id] = r.roomType || 'Unknown'; });
    const totalRooms = roomType
      ? rooms.filter((r) => (r.roomType || '').toLowerCase() === (roomType || '').toLowerCase()).length
      : rooms.length;

    const billWhere = {
      status: { [Op.in]: ['SETTLED', 'PENDING'] },
      createdAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] },
    };

    const bills = await RoomBill.findAll({ where: billWhere });
    let totalRevenue = 0;
    let roomNightsSold = 0;

    bills.forEach((b) => {
      const type = roomMap[b.roomId] || 'Unknown';
      if (roomType && type.toLowerCase() !== (roomType || '').toLowerCase()) return;
      const rev = parseFloat(b.grandTotal || 0);
      const nights = parseInt(b.nights || 1, 10);
      totalRevenue += rev;
      roomNightsSold += nights;
    });

    const days = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (24 * 60 * 60 * 1000)) + 1);
    const adr = calculateADR(totalRevenue, roomNightsSold);
    const revpar = calculateRevPAR(totalRevenue, totalRooms, days);

    res.json({
      totalRoomRevenue: totalRevenue,
      roomNightsSold,
      totalBookings: bills.length,
      totalRooms,
      adr,
      revpar,
      currency: 'INR',
      startDate,
      endDate,
    });
  } catch (error) {
    console.error('getRoomRevenueSummary error:', error);
    res.status(500).json({ message: 'Failed to load room revenue summary', error: error.message });
  }
};

exports.getRevenueByRoomType = async (req, res) => {
  try {
    const { RoomBill, Room } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);

    const rooms = await Room.findAll({ where: { status: { [Op.ne]: 'maintenance' } } });
    const roomMap = {};
    rooms.forEach((r) => { roomMap[r.id] = r.roomType || 'Unknown'; });

    const bills = await RoomBill.findAll({
      where: {
        status: { [Op.in]: ['SETTLED', 'PENDING'] },
        createdAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] },
      },
    });

    const byType = {};
    bills.forEach((b) => {
      const type = roomMap[b.roomId] || 'Unknown';
      if (!byType[type]) byType[type] = { roomType: type, revenue: 0, roomNights: 0, bookings: 0 };
      byType[type].revenue += parseFloat(b.grandTotal || 0);
      byType[type].roomNights += parseInt(b.nights || 1, 10);
      byType[type].bookings += 1;
    });

    const revenueByRoomType = Object.values(byType).sort((a, b) => (b.revenue || 0) - (a.revenue || 0));

    res.json({ revenueByRoomType });
  } catch (error) {
    console.error('getRevenueByRoomType error:', error);
    res.status(500).json({ message: 'Failed to load revenue by room type', error: error.message });
  }
};

exports.getRevenueByDateRange = async (req, res) => {
  try {
    const { RoomBill, Room } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);
    const roomType = req.query.roomType || null;

    const rooms = await Room.findAll({ where: { status: { [Op.ne]: 'maintenance' } } });
    const roomMap = {};
    rooms.forEach((r) => { roomMap[r.id] = r.roomType || 'Unknown'; });

    const bills = await RoomBill.findAll({
      where: {
        status: { [Op.in]: ['SETTLED', 'PENDING'] },
        createdAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] },
      },
    });

    const byDate = {};
    bills.forEach((b) => {
      const type = roomMap[b.roomId] || 'Unknown';
      if (roomType && type.toLowerCase() !== (roomType || '').toLowerCase()) return;
      const d = (b.createdAt || b.checkOut).toString().slice(0, 10);
      if (!byDate[d]) byDate[d] = { date: d, revenue: 0, roomsSold: 0 };
      byDate[d].revenue += parseFloat(b.grandTotal || 0);
      byDate[d].roomsSold += parseInt(b.nights || 1, 10);
    });

    const revenueByDate = Object.values(byDate)
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({ revenueByDate });
  } catch (error) {
    console.error('getRevenueByDateRange error:', error);
    res.status(500).json({ message: 'Failed to load revenue by date', error: error.message });
  }
};

exports.getRevenueTrend = async (req, res) => {
  try {
    const { RoomBill, Room } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);

    const rooms = await Room.findAll({ where: { status: { [Op.ne]: 'maintenance' } } });
    const roomMap = {};
    rooms.forEach((r) => { roomMap[r.id] = r.roomType || 'Unknown'; });

    const bills = await RoomBill.findAll({
      where: {
        status: { [Op.in]: ['SETTLED', 'PENDING'] },
        createdAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] },
      },
    });

    const byDate = {};
    bills.forEach((b) => {
      const d = (b.createdAt || b.checkOut).toString().slice(0, 10);
      if (!byDate[d]) byDate[d] = 0;
      byDate[d] += parseFloat(b.grandTotal || 0);
    });

    const trend = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue }));

    const byType = {};
    bills.forEach((b) => {
      const type = roomMap[b.roomId] || 'Unknown';
      byType[type] = (byType[type] || 0) + parseFloat(b.grandTotal || 0);
    });
    const roomTypeRevenue = Object.entries(byType)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    res.json({ trend, roomTypeRevenue });
  } catch (error) {
    console.error('getRevenueTrend error:', error);
    res.status(500).json({ message: 'Failed to load revenue trend', error: error.message });
  }
};

exports.getRoomRevenueDetails = async (req, res) => {
  try {
    const { RoomBill, Room } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);
    const roomType = req.query.roomType || null;

    const rooms = await Room.findAll({ where: { status: { [Op.ne]: 'maintenance' } } });
    const roomMap = {};
    rooms.forEach((r) => { roomMap[r.id] = r.roomType || 'Unknown'; });

    const bills = await RoomBill.findAll({
      where: {
        status: { [Op.in]: ['SETTLED', 'PENDING'] },
        createdAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] },
      },
      order: [['createdAt', 'DESC']],
      limit: 200,
    });

    const details = bills
      .filter((b) => {
        const type = roomMap[b.roomId] || 'Unknown';
        if (roomType && type.toLowerCase() !== (roomType || '').toLowerCase()) return false;
        return true;
      })
      .map((b) => {
        const type = roomMap[b.roomId] || 'Unknown';
        return {
          billNumber: b.billNumber,
          roomNumber: b.roomNumber,
          roomType: type,
          guestName: b.guestName,
          checkIn: (b.checkIn || '').toString().slice(0, 10),
          checkOut: (b.checkOut || '').toString().slice(0, 10),
          nights: parseInt(b.nights || 1, 10),
          revenue: parseFloat(b.grandTotal || 0),
        };
      });

    res.json({ details });
  } catch (error) {
    console.error('getRoomRevenueDetails error:', error);
    res.status(500).json({ message: 'Failed to load room revenue details', error: error.message });
  }
};

exports.exportRoomRevenueReport = async (req, res) => {
  try {
    const { RoomBill, Room } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);
    const roomType = req.query.roomType || null;

    const rooms = await Room.findAll({ where: { status: { [Op.ne]: 'maintenance' } } });
    const roomMap = {};
    rooms.forEach((r) => { roomMap[r.id] = r.roomType || 'Unknown'; });
    const totalRooms = roomType
      ? rooms.filter((r) => (r.roomType || '').toLowerCase() === (roomType || '').toLowerCase()).length
      : rooms.length;

    const billWhere = {
      status: { [Op.in]: ['SETTLED', 'PENDING'] },
      createdAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] },
    };
    const bills = await RoomBill.findAll({ where: billWhere });

    let totalRevenue = 0;
    let roomNightsSold = 0;
    const byType = {};
    const byDate = {};
    const details = [];

    bills.forEach((b) => {
      const type = roomMap[b.roomId] || 'Unknown';
      if (roomType && type.toLowerCase() !== (roomType || '').toLowerCase()) return;
      const rev = parseFloat(b.grandTotal || 0);
      const nights = parseInt(b.nights || 1, 10);
      totalRevenue += rev;
      roomNightsSold += nights;
      byType[type] = (byType[type] || 0) + rev;
      const d = (b.createdAt || b.checkOut).toString().slice(0, 10);
      byDate[d] = (byDate[d] || 0) + rev;
      details.push({
        billNumber: b.billNumber,
        roomNumber: b.roomNumber,
        roomType: type,
        guestName: b.guestName,
        checkIn: (b.checkIn || '').toString().slice(0, 10),
        checkOut: (b.checkOut || '').toString().slice(0, 10),
        nights,
        revenue: rev,
      });
    });

    const days = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (24 * 60 * 60 * 1000)) + 1);
    const adr = calculateADR(totalRevenue, roomNightsSold);
    const revpar = calculateRevPAR(totalRevenue, totalRooms, days);

    res.json({
      summary: {
        totalRoomRevenue: totalRevenue,
        roomNightsSold,
        totalBookings: bills.length,
        totalRooms,
        adr,
        revpar,
      },
      revenueByRoomType: Object.entries(byType).map(([roomTypeName, revenue]) => ({ roomType: roomTypeName, revenue })),
      revenueByDate: Object.entries(byDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, revenue]) => ({ date, revenue })),
      details: details.slice(0, 500),
      filters: { startDate, endDate, roomType },
    });
  } catch (error) {
    console.error('exportRoomRevenueReport error:', error);
    res.status(500).json({ message: 'Failed to export room revenue report', error: error.message });
  }
};
