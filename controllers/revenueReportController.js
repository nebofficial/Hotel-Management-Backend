const { Op } = require('sequelize');

function parseDateRange(req) {
  const start = req.query.startDate || null;
  const end = req.query.endDate || null;
  const endDate = end ? new Date(end) : new Date();
  const startDate = start ? new Date(start) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { startDate: startDate.toISOString().slice(0, 10), endDate: endDate.toISOString().slice(0, 10) };
}

function getDateFilter(startDate, endDate) {
  return { createdAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] } };
}

exports.getTotalRevenue = async (req, res) => {
  try {
    const { RoomBill, RestaurantBill, RoomServiceOrder, BarOrder, Invoice } = req.hotelModels;
    const today = new Date().toISOString().slice(0, 10);
    const monthStart = today.slice(0, 7) + '-01';
    const yearStart = today.slice(0, 4) + '-01-01';

    const getRev = (list, field) => list.reduce((s, b) => s + parseFloat(b[field] || 0), 0);

    const todayEnd = new Date(today + 'T23:59:59');
    const monthEnd = new Date(today + 'T23:59:59');
    const yearEnd = new Date(today + 'T23:59:59');

    const [roomBillsToday, restBillsToday, rsToday, barToday, roomBillsMonth, restBillsMonth, rsMonth, barMonth, roomBillsYear, restBillsYear, rsYear, barYear] = await Promise.all([
      RoomBill.findAll({ where: { status: { [Op.in]: ['SETTLED', 'PENDING'] }, createdAt: { [Op.between]: [new Date(today), todayEnd] } } }),
      RestaurantBill.findAll({ where: { status: { [Op.in]: ['Paid', 'On Hold'] }, createdAt: { [Op.between]: [new Date(today), todayEnd] } } }),
      RoomServiceOrder.findAll({ where: { status: { [Op.ne]: 'Cancelled' }, createdAt: { [Op.between]: [new Date(today), todayEnd] } } }),
      BarOrder ? BarOrder.findAll({ where: { status: { [Op.in]: ['Served', 'Ready'] }, createdAt: { [Op.between]: [new Date(today), todayEnd] } } }) : [],
      RoomBill.findAll({ where: { status: { [Op.in]: ['SETTLED', 'PENDING'] }, createdAt: { [Op.between]: [new Date(monthStart), monthEnd] } } }),
      RestaurantBill.findAll({ where: { status: { [Op.in]: ['Paid', 'On Hold'] }, createdAt: { [Op.between]: [new Date(monthStart), monthEnd] } } }),
      RoomServiceOrder.findAll({ where: { status: { [Op.ne]: 'Cancelled' }, createdAt: { [Op.between]: [new Date(monthStart), monthEnd] } } }),
      BarOrder ? BarOrder.findAll({ where: { status: { [Op.in]: ['Served', 'Ready'] }, createdAt: { [Op.between]: [new Date(monthStart), monthEnd] } } }) : [],
      RoomBill.findAll({ where: { status: { [Op.in]: ['SETTLED', 'PENDING'] }, createdAt: { [Op.between]: [new Date(yearStart), yearEnd] } } }),
      RestaurantBill.findAll({ where: { status: { [Op.in]: ['Paid', 'On Hold'] }, createdAt: { [Op.between]: [new Date(yearStart), yearEnd] } } }),
      RoomServiceOrder.findAll({ where: { status: { [Op.ne]: 'Cancelled' }, createdAt: { [Op.between]: [new Date(yearStart), yearEnd] } } }),
      BarOrder ? BarOrder.findAll({ where: { status: { [Op.in]: ['Served', 'Ready'] }, createdAt: { [Op.between]: [new Date(yearStart), yearEnd] } } }) : [],
    ]);

    const roomToday = getRev(roomBillsToday, 'grandTotal');
    const restToday = getRev(restBillsToday, 'totalAmount') + getRev(rsToday, 'totalAmount') + getRev(barToday, 'totalAmount');
    const totalToday = roomToday + restToday;

    const roomMonth = getRev(roomBillsMonth, 'grandTotal');
    const restMonth = getRev(restBillsMonth, 'totalAmount') + getRev(rsMonth, 'totalAmount') + getRev(barMonth, 'totalAmount');
    const totalMonth = roomMonth + restMonth;

    const roomYear = getRev(roomBillsYear, 'grandTotal');
    const restYear = getRev(restBillsYear, 'totalAmount') + getRev(rsYear, 'totalAmount') + getRev(barYear, 'totalAmount');
    const totalYear = roomYear + restYear;

    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const daysElapsed = new Date().getDate();
    const avgDailyRevenue = daysElapsed > 0 ? totalMonth / daysElapsed : 0;

    res.json({
      totalRevenueToday: totalToday,
      totalRevenueThisMonth: totalMonth,
      totalRevenueThisYear: totalYear,
      averageDailyRevenue: avgDailyRevenue,
      roomRevenue: roomMonth,
      restaurantRevenue: restMonth,
    });
  } catch (error) {
    console.error('getTotalRevenue error:', error);
    res.status(500).json({ message: 'Failed to load total revenue', error: error.message });
  }
};

exports.getRevenueByRooms = async (req, res) => {
  try {
    const { RoomBill, Room } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);
    const dateFilter = getDateFilter(startDate, endDate);

    const rooms = await Room.findAll({ where: { status: { [Op.ne]: 'maintenance' } } });
    const roomMap = {};
    rooms.forEach((r) => { roomMap[r.id] = r.roomType || 'Unknown'; });

    const bills = await RoomBill.findAll({
      where: { status: { [Op.in]: ['SETTLED', 'PENDING'] }, ...dateFilter },
    });

    const byType = {};
    bills.forEach((b) => {
      const type = roomMap[b.roomId] || 'Unknown';
      if (!byType[type]) byType[type] = { roomType: type, revenue: 0, bookings: 0 };
      byType[type].revenue += parseFloat(b.grandTotal || 0);
      byType[type].bookings += 1;
    });

    const revenueByRooms = Object.values(byType).sort((a, b) => b.revenue - a.revenue);
    res.json({ revenueByRooms, startDate, endDate });
  } catch (error) {
    console.error('getRevenueByRooms error:', error);
    res.status(500).json({ message: 'Failed to load revenue by rooms', error: error.message });
  }
};

exports.getRevenueByRestaurant = async (req, res) => {
  try {
    const { RestaurantBill, RoomServiceOrder, BarOrder } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);
    const dateFilter = getDateFilter(startDate, endDate);

    const [restBills, rsOrders, barOrders] = await Promise.all([
      RestaurantBill.findAll({ where: { ...dateFilter, status: { [Op.in]: ['Paid', 'On Hold'] } } }),
      RoomServiceOrder.findAll({ where: { ...dateFilter, status: { [Op.ne]: 'Cancelled' } } }),
      BarOrder ? BarOrder.findAll({ where: { ...dateFilter, status: { [Op.in]: ['Served', 'Ready'] } } }) : [],
    ]);

    const totalOrders = restBills.length + rsOrders.length + (barOrders || []).length;
    let totalSales = 0;
    restBills.forEach((b) => { totalSales += parseFloat(b.totalAmount || 0); });
    rsOrders.forEach((o) => { totalSales += parseFloat(o.totalAmount || 0); });
    (barOrders || []).forEach((o) => { totalSales += parseFloat(o.totalAmount || 0); });
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    res.json({
      totalOrders,
      totalSales,
      averageOrderValue,
      restaurantRevenue: totalSales,
      startDate,
      endDate,
    });
  } catch (error) {
    console.error('getRevenueByRestaurant error:', error);
    res.status(500).json({ message: 'Failed to load restaurant revenue', error: error.message });
  }
};

exports.getRevenueByServices = async (req, res) => {
  try {
    const { RoomBill, RoomServiceOrder, BarOrder, Invoice } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);
    const dateFilter = getDateFilter(startDate, endDate);
    const invDateFilter = Invoice ? { issueDate: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] } } : null;

    const [roomBills, rsOrders, barOrders, invoices] = await Promise.all([
      RoomBill.findAll({ where: { status: { [Op.in]: ['SETTLED', 'PENDING'] }, ...dateFilter } }),
      RoomServiceOrder.findAll({ where: { ...dateFilter, status: { [Op.ne]: 'Cancelled' } } }),
      BarOrder ? BarOrder.findAll({ where: { ...dateFilter, status: { [Op.in]: ['Served', 'Ready'] } } }) : [],
      Invoice && invDateFilter ? Invoice.findAll({ where: invDateFilter }) : [],
    ]);

    let roomServiceRevenue = 0;
    rsOrders.forEach((o) => { roomServiceRevenue += parseFloat(o.totalAmount || 0); });
    let barRevenue = 0;
    (barOrders || []).forEach((o) => { barRevenue += parseFloat(o.totalAmount || 0); });
    let extrasRevenue = 0;
    roomBills.forEach((b) => { extrasRevenue += parseFloat(b.extrasSubtotal || 0); });
    let invoiceRevenue = 0;
    (invoices || []).forEach((i) => { invoiceRevenue += parseFloat(i.totalAmount || i.amount || 0); });

    const services = [
      { name: 'Room Service', revenue: roomServiceRevenue },
      { name: 'Bar', revenue: barRevenue },
      { name: 'Extras', revenue: extrasRevenue },
      { name: 'Invoice/Other', revenue: invoiceRevenue },
    ].filter((s) => s.revenue > 0);

    const totalServiceRevenue = services.reduce((s, x) => s + x.revenue, 0);
    res.json({ services, totalServiceRevenue, startDate, endDate });
  } catch (error) {
    console.error('getRevenueByServices error:', error);
    res.status(500).json({ message: 'Failed to load services revenue', error: error.message });
  }
};

exports.getDailyRevenue = async (req, res) => {
  try {
    const { RoomBill, RestaurantBill, RoomServiceOrder, BarOrder } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);
    const dateFilter = getDateFilter(startDate, endDate);

    const [roomBills, restBills, rsOrders, barOrders] = await Promise.all([
      RoomBill.findAll({ where: { status: { [Op.in]: ['SETTLED', 'PENDING'] }, ...dateFilter } }),
      RestaurantBill.findAll({ where: { ...dateFilter, status: { [Op.in]: ['Paid', 'On Hold'] } } }),
      RoomServiceOrder.findAll({ where: { ...dateFilter, status: { [Op.ne]: 'Cancelled' } } }),
      BarOrder ? BarOrder.findAll({ where: { ...dateFilter, status: { [Op.in]: ['Served', 'Ready'] } } }) : [],
    ]);

    const byDate = {};
    const add = (list, field, dept) => {
      list.forEach((b) => {
        const d = (b.createdAt || '').toString().slice(0, 10);
        if (!d) return;
        if (!byDate[d]) byDate[d] = {};
        if (!byDate[d][dept]) byDate[d][dept] = 0;
        byDate[d][dept] += parseFloat(b[field] || 0);
      });
    };
    add(roomBills, 'grandTotal', 'Rooms');
    add(restBills, 'totalAmount', 'Restaurant');
    add(rsOrders, 'totalAmount', 'Services');
    add(barOrders || [], 'totalAmount', 'Bar');

    const daily = Object.entries(byDate)
      .map(([date, depts]) => {
        const total = Object.values(depts).reduce((s, v) => s + v, 0);
        return { date, ...depts, total };
      })
      .sort((a, b) => b.date.localeCompare(a.date));

    res.json({ daily, startDate, endDate });
  } catch (error) {
    console.error('getDailyRevenue error:', error);
    res.status(500).json({ message: 'Failed to load daily revenue', error: error.message });
  }
};

exports.getMonthlyRevenue = async (req, res) => {
  try {
    const { RoomBill, RestaurantBill, RoomServiceOrder, BarOrder } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);
    const dateFilter = getDateFilter(startDate, endDate);

    const [roomBills, restBills, rsOrders, barOrders] = await Promise.all([
      RoomBill.findAll({ where: { status: { [Op.in]: ['SETTLED', 'PENDING'] }, ...dateFilter } }),
      RestaurantBill.findAll({ where: { ...dateFilter, status: { [Op.in]: ['Paid', 'On Hold'] } } }),
      RoomServiceOrder.findAll({ where: { ...dateFilter, status: { [Op.ne]: 'Cancelled' } } }),
      BarOrder ? BarOrder.findAll({ where: { ...dateFilter, status: { [Op.in]: ['Served', 'Ready'] } } }) : [],
    ]);

    const byMonth = {};
    const add = (list, field, dept) => {
      list.forEach((b) => {
        const d = new Date(b.createdAt || 0);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!byMonth[key]) byMonth[key] = {};
        if (!byMonth[key][dept]) byMonth[key][dept] = 0;
        byMonth[key][dept] += parseFloat(b[field] || 0);
      });
    };
    add(roomBills, 'grandTotal', 'Rooms');
    add(restBills, 'totalAmount', 'Restaurant');
    add(rsOrders, 'totalAmount', 'Services');
    add(barOrders || [], 'totalAmount', 'Bar');

    const monthly = Object.entries(byMonth)
      .map(([month, depts]) => {
        const total = Object.values(depts).reduce((s, v) => s + v, 0);
        return {
          month,
          monthLabel: new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' }),
          ...depts,
          total,
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));

    res.json({ monthly, startDate, endDate });
  } catch (error) {
    console.error('getMonthlyRevenue error:', error);
    res.status(500).json({ message: 'Failed to load monthly revenue', error: error.message });
  }
};

exports.getRevenueTrend = async (req, res) => {
  try {
    const { RoomBill, RestaurantBill, RoomServiceOrder, BarOrder } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);
    const dateFilter = getDateFilter(startDate, endDate);

    const [roomBills, restBills, rsOrders, barOrders] = await Promise.all([
      RoomBill.findAll({ where: { status: { [Op.in]: ['SETTLED', 'PENDING'] }, ...dateFilter } }),
      RestaurantBill.findAll({ where: { ...dateFilter, status: { [Op.in]: ['Paid', 'On Hold'] } } }),
      RoomServiceOrder.findAll({ where: { ...dateFilter, status: { [Op.ne]: 'Cancelled' } } }),
      BarOrder ? BarOrder.findAll({ where: { ...dateFilter, status: { [Op.in]: ['Served', 'Ready'] } } }) : [],
    ]);

    const byDate = {};
    const add = (list, field, dept) => {
      list.forEach((b) => {
        const d = (b.createdAt || '').toString().slice(0, 10);
        if (!d) return;
        if (!byDate[d]) byDate[d] = { date: d, Rooms: 0, Restaurant: 0, Services: 0 };
        byDate[d][dept] = (byDate[d][dept] || 0) + parseFloat(b[field] || 0);
      });
    };
    add(roomBills, 'grandTotal', 'Rooms');
    add(restBills, 'totalAmount', 'Restaurant');
    add(rsOrders, 'totalAmount', 'Services');
    add(barOrders || [], 'totalAmount', 'Restaurant');

    const trend = Object.values(byDate)
      .map((r) => ({ ...r, total: (r.Rooms || 0) + (r.Restaurant || 0) + (r.Services || 0) }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const departmentRevenue = [
      { name: 'Rooms', value: trend.reduce((s, t) => s + (t.Rooms || 0), 0) },
      { name: 'Restaurant', value: trend.reduce((s, t) => s + (t.Restaurant || 0), 0) },
      { name: 'Services', value: trend.reduce((s, t) => s + (t.Services || 0), 0) },
    ].filter((d) => d.value > 0);

    res.json({ trend, departmentRevenue, startDate, endDate });
  } catch (error) {
    console.error('getRevenueTrend error:', error);
    res.status(500).json({ message: 'Failed to load revenue trend', error: error.message });
  }
};

exports.exportRevenueReport = async (req, res) => {
  try {
    const { RoomBill, RestaurantBill, RoomServiceOrder, BarOrder } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);
    const dateFilter = getDateFilter(startDate, endDate);

    const [roomBills, restBills, rsOrders, barOrders] = await Promise.all([
      RoomBill.findAll({ where: { status: { [Op.in]: ['SETTLED', 'PENDING'] }, ...dateFilter } }),
      RestaurantBill.findAll({ where: { ...dateFilter, status: { [Op.in]: ['Paid', 'On Hold'] } } }),
      RoomServiceOrder.findAll({ where: { ...dateFilter, status: { [Op.ne]: 'Cancelled' } } }),
      BarOrder ? BarOrder.findAll({ where: { ...dateFilter, status: { [Op.in]: ['Served', 'Ready'] } } }) : [],
    ]);

    let roomRevenue = 0;
    roomBills.forEach((b) => { roomRevenue += parseFloat(b.grandTotal || 0); });
    let restRevenue = 0;
    restBills.forEach((b) => { restRevenue += parseFloat(b.totalAmount || 0); });
    rsOrders.forEach((o) => { restRevenue += parseFloat(o.totalAmount || 0); });
    (barOrders || []).forEach((o) => { restRevenue += parseFloat(o.totalAmount || 0); });
    const totalRevenue = roomRevenue + restRevenue;

    const daily = {};
    [...roomBills, ...restBills, ...rsOrders, ...(barOrders || [])].forEach((b) => {
      const d = (b.createdAt || '').toString().slice(0, 10);
      const amt = parseFloat(b.grandTotal || b.totalAmount || 0);
      if (d) daily[d] = (daily[d] || 0) + amt;
    });

    const dailyArr = Object.entries(daily)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({ date, total }));

    res.json({
      summary: { totalRevenue, roomRevenue, restaurantRevenue: restRevenue },
      daily: dailyArr,
      filters: { startDate, endDate },
    });
  } catch (error) {
    console.error('exportRevenueReport error:', error);
    res.status(500).json({ message: 'Failed to export revenue report', error: error.message });
  }
};
