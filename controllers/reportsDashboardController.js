const { Op } = require('sequelize');

function parseDateRange(req) {
  const start = req.query.startDate || null;
  const end = req.query.endDate || null;
  const endDate = end ? new Date(end) : new Date();
  const startDate = start ? new Date(start) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { startDate: startDate.toISOString().slice(0, 10), endDate: endDate.toISOString().slice(0, 10) };
}

exports.getRevenueSummary = async (req, res) => {
  try {
    const { RoomBill, RoomServiceOrder } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);

    const billWhere = {
      status: { [Op.in]: ['SETTLED', 'PENDING'] },
      createdAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] },
    };

    const roomBills = await RoomBill.findAll({ where: billWhere });
    const roomRevenue = roomBills.reduce((sum, b) => sum + parseFloat(b.grandTotal || 0), 0);

    const orderWhere = {
      status: { [Op.ne]: 'Cancelled' },
      createdAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] },
    };
    const orders = await RoomServiceOrder.findAll({ where: orderWhere });
    const restaurantRevenue = orders.reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0);

    const totalRevenue = roomRevenue + restaurantRevenue;
    const otherServicesRevenue = roomBills.reduce((sum, b) => sum + parseFloat(b.extrasSubtotal || 0), 0);

    const byDate = {};
    roomBills.forEach((b) => {
      const d = (b.createdAt || b.updatedAt).toISOString().slice(0, 10);
      byDate[d] = (byDate[d] || 0) + parseFloat(b.grandTotal || 0);
    });
    orders.forEach((o) => {
      const d = (o.createdAt || '').toString().slice(0, 10);
      if (d) byDate[d] = (byDate[d] || 0) + parseFloat(o.totalAmount || 0);
    });

    const byDateArr = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({ date, total }));

    res.json({
      totalRevenue,
      roomRevenue,
      restaurantRevenue,
      otherServicesRevenue,
      currency: 'INR',
      byDate: byDateArr,
      bySource: [
        { name: 'Room', value: roomRevenue },
        { name: 'Restaurant', value: restaurantRevenue },
        { name: 'Other', value: otherServicesRevenue },
      ],
    });
  } catch (error) {
    console.error('getRevenueSummary error:', error);
    res.status(500).json({ message: 'Failed to load revenue summary', error: error.message });
  }
};

exports.getOccupancyStats = async (req, res) => {
  try {
    const { Room, Booking } = req.hotelModels;
    const today = new Date().toISOString().slice(0, 10);

    const rooms = await Room.findAll({ where: { status: { [Op.ne]: 'maintenance' } } });
    const totalRooms = rooms.length;

    const activeBookings = await Booking.findAll({
      where: {
        status: { [Op.in]: ['confirmed', 'checked_in'] },
        checkIn: { [Op.lte]: new Date(today + 'T23:59:59') },
        checkOut: { [Op.gte]: new Date(today) },
      },
    });
    const roomsOccupiedToday = activeBookings.length;
    const roomsAvailableToday = Math.max(0, totalRooms - roomsOccupiedToday);
    const occupancyRateToday = totalRooms > 0 ? (roomsOccupiedToday / totalRooms) * 100 : 0;

    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const count = await Booking.count({
        where: {
          status: { [Op.in]: ['confirmed', 'checked_in'] },
          checkIn: { [Op.lte]: new Date(dateStr + 'T23:59:59') },
          checkOut: { [Op.gte]: new Date(dateStr) },
        },
      });
      trend.push({
        date: dateStr,
        occupancyRate: totalRooms > 0 ? (count / totalRooms) * 100 : 0,
      });
    }

    res.json({
      totalRooms,
      roomsOccupiedToday,
      roomsAvailableToday,
      occupancyRateToday,
      trend,
    });
  } catch (error) {
    console.error('getOccupancyStats error:', error);
    res.status(500).json({ message: 'Failed to load occupancy stats', error: error.message });
  }
};

exports.getRestaurantSales = async (req, res) => {
  try {
    const { RoomServiceOrder } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);

    const orders = await RoomServiceOrder.findAll({
      where: {
        status: { [Op.ne]: 'Cancelled' },
        createdAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] },
      },
    });

    const totalSales = orders.reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0);
    const ordersCount = orders.length;
    const avgOrderValue = ordersCount > 0 ? totalSales / ordersCount : 0;

    const itemTotals = {};
    orders.forEach((o) => {
      const items = Array.isArray(o.items) ? o.items : [];
      items.forEach((item) => {
        const name = item.name || item.id || 'Unknown';
        const amt = (item.quantity || 1) * parseFloat(item.price || 0);
        itemTotals[name] = (itemTotals[name] || 0) + amt;
      });
    });
    const topItems = Object.entries(itemTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, total]) => ({ name, total }));

    const byDay = {};
    orders.forEach((o) => {
      const d = (o.createdAt || '').toString().slice(0, 10);
      if (d) byDay[d] = (byDay[d] || 0) + parseFloat(o.totalAmount || 0);
    });
    const byDayArr = Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({ date, total }));

    res.json({
      totalSales,
      ordersCount,
      avgOrderValue,
      topItems,
      byDay: byDayArr,
    });
  } catch (error) {
    console.error('getRestaurantSales error:', error);
    res.status(500).json({ message: 'Failed to load restaurant sales', error: error.message });
  }
};

exports.getExpenseSummary = async (req, res) => {
  try {
    const { Expense } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);

    const expenses = await Expense.findAll({
      where: {
        expenseDate: { [Op.between]: [startDate, endDate] },
        status: { [Op.ne]: 'Rejected' },
      },
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const byCategory = {};
    expenses.forEach((e) => {
      const cat = e.category || 'Other';
      byCategory[cat] = (byCategory[cat] || 0) + parseFloat(e.amount || 0);
    });

    const operationalCategories = ['Salary', 'Utilities', 'Supplies', 'Marketing', 'Other'];
    const maintenanceCategories = ['Maintenance', 'Repairs'];
    let operationalCosts = 0;
    let maintenanceCosts = 0;
    Object.entries(byCategory).forEach(([cat, amt]) => {
      if (maintenanceCategories.some((m) => cat.toLowerCase().includes(m.toLowerCase()))) {
        maintenanceCosts += amt;
      } else {
        operationalCosts += amt;
      }
    });

    res.json({
      totalExpenses,
      operationalCosts,
      maintenanceCosts,
      byCategory: Object.entries(byCategory).map(([name, value]) => ({ name, value })),
    });
  } catch (error) {
    console.error('getExpenseSummary error:', error);
    res.status(500).json({ message: 'Failed to load expense summary', error: error.message });
  }
};

exports.getCharts = async (req, res) => {
  try {
    const { RoomBill, RoomServiceOrder, Booking, Room, Expense } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);

    const billWhere = {
      status: { [Op.in]: ['SETTLED', 'PENDING'] },
      createdAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] },
    };
    const roomBills = await RoomBill.findAll({ where: billWhere });
    const orderWhere = {
      status: { [Op.ne]: 'Cancelled' },
      createdAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] },
    };
    const orders = await RoomServiceOrder.findAll({ where: orderWhere });
    const rooms = await Room.findAll({ where: { status: { [Op.ne]: 'maintenance' } } });
    const totalRooms = rooms.length;

    const revenueByDate = {};
    roomBills.forEach((b) => {
      const d = (b.createdAt || '').toString().slice(0, 10);
      if (d) revenueByDate[d] = (revenueByDate[d] || 0) + parseFloat(b.grandTotal || 0);
    });
    orders.forEach((o) => {
      const d = (o.createdAt || '').toString().slice(0, 10);
      if (d) revenueByDate[d] = (revenueByDate[d] || 0) + parseFloat(o.totalAmount || 0);
    });
    const revenueTrend = Object.entries(revenueByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({ date, total }));

    const occupancyByDate = {};
    for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().slice(0, 10);
      const count = await Booking.count({
        where: {
          status: { [Op.in]: ['confirmed', 'checked_in'] },
          checkIn: { [Op.lte]: new Date(dateStr + 'T23:59:59') },
          checkOut: { [Op.gte]: new Date(dateStr) },
        },
      });
      occupancyByDate[dateStr] = totalRooms > 0 ? (count / totalRooms) * 100 : 0;
    }
    const occupancyTrend = Object.entries(occupancyByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, occupancyRate]) => ({ date, occupancyRate }));

    const roomRev = roomBills.reduce((sum, b) => sum + parseFloat(b.grandTotal || 0), 0);
    const restRev = orders.reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0);
    const salesBreakdown = [
      { name: 'Room', value: roomRev },
      { name: 'Restaurant', value: restRev },
    ].filter((x) => x.value > 0);

    const recentReports = [
      { id: '1', title: 'Revenue Summary', subtitle: `Period: ${startDate} - ${endDate}`, href: '/reports/revenue', generatedAt: new Date().toISOString() },
      { id: '2', title: 'Occupancy Report', subtitle: 'Room utilization', href: '/reports/occupancy', generatedAt: new Date().toISOString() },
    ];

    res.json({
      revenueTrend,
      occupancyTrend,
      salesBreakdown,
      recentReports,
    });
  } catch (error) {
    console.error('getCharts error:', error);
    res.status(500).json({ message: 'Failed to load charts', error: error.message });
  }
};

exports.exportReport = async (req, res) => {
  try {
    const { RoomBill, RoomServiceOrder, Booking, Room, Expense } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);

    const billWhere = {
      status: { [Op.in]: ['SETTLED', 'PENDING'] },
      createdAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] },
    };
    const roomBills = await RoomBill.findAll({ where: billWhere });
    const roomRevenue = roomBills.reduce((sum, b) => sum + parseFloat(b.grandTotal || 0), 0);

    const orderWhere = {
      status: { [Op.ne]: 'Cancelled' },
      createdAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] },
    };
    const orders = await RoomServiceOrder.findAll({ where: orderWhere });
    const restaurantRevenue = orders.reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0);

    const rooms = await Room.findAll({ where: { status: { [Op.ne]: 'maintenance' } } });
    const today = new Date().toISOString().slice(0, 10);
    const occupied = await Booking.count({
      where: {
        status: { [Op.in]: ['confirmed', 'checked_in'] },
        checkIn: { [Op.lte]: new Date(today + 'T23:59:59') },
        checkOut: { [Op.gte]: new Date(today) },
      },
    });

    const expenses = await Expense.findAll({
      where: {
        expenseDate: { [Op.between]: [startDate, endDate] },
        status: { [Op.ne]: 'Rejected' },
      },
    });
    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const operationalCosts = expenses
      .filter((e) => !(e.category || '').toLowerCase().includes('maintenance'))
      .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const maintenanceCosts = expenses
      .filter((e) => (e.category || '').toLowerCase().includes('maintenance'))
      .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

    const revenueSummary = {
      totalRevenue: roomRevenue + restaurantRevenue,
      roomRevenue,
      restaurantRevenue,
      otherServicesRevenue: roomBills.reduce((sum, b) => sum + parseFloat(b.extrasSubtotal || 0), 0),
    };
    const occupancyStats = {
      totalRooms: rooms.length,
      roomsOccupiedToday: occupied,
      roomsAvailableToday: Math.max(0, rooms.length - occupied),
      occupancyRateToday: rooms.length > 0 ? (occupied / rooms.length) * 100 : 0,
    };
    const restaurantSales = {
      totalSales: restaurantRevenue,
      ordersCount: orders.length,
      avgOrderValue: orders.length > 0 ? restaurantRevenue / orders.length : 0,
    };
    const expenseSummary = {
      totalExpenses,
      operationalCosts,
      maintenanceCosts,
    };

    res.json({
      revenueSummary,
      occupancyStats,
      restaurantSales,
      expenseSummary,
    });
  } catch (error) {
    console.error('exportReport error:', error);
    res.status(500).json({ message: 'Failed to export report', error: error.message });
  }
};
