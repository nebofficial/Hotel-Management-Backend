const { Op } = require('sequelize');

function parseDateRange(req) {
  const start = req.query.startDate || null;
  const end = req.query.endDate || null;
  const endDate = end ? new Date(end) : new Date();
  const startDate = start ? new Date(start) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { startDate: startDate.toISOString().slice(0, 10), endDate: endDate.toISOString().slice(0, 10) };
}

function collectItemsFromBill(bill, source) {
  const items = Array.isArray(bill.items) ? bill.items : [];
  return items.map((it) => ({
    id: it.id,
    name: it.name || 'Unknown',
    quantity: parseInt(it.quantity || 1, 10),
    price: parseFloat(it.price || it.unitPrice || 0),
    category: it.category || null,
    source,
  }));
}

exports.getRestaurantSalesSummary = async (req, res) => {
  try {
    const { RestaurantBill, RoomServiceOrder, BarOrder } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);

    const dateFilter = {
      createdAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] },
    };
    const restWhere = { ...dateFilter, status: { [Op.in]: ['Paid', 'On Hold'] } };
    const rsWhere = { ...dateFilter, status: { [Op.ne]: 'Cancelled' } };
    const barWhere = { ...dateFilter, status: { [Op.in]: ['Served', 'Ready'] } };

    const [restBills, rsOrders, barOrders] = await Promise.all([
      RestaurantBill.findAll({ where: restWhere }),
      RoomServiceOrder.findAll({ where: rsWhere }),
      BarOrder ? BarOrder.findAll({ where: barWhere }) : [],
    ]);

    let totalRevenue = 0;
    let ordersCount = 0;
    restBills.forEach((b) => {
      totalRevenue += parseFloat(b.totalAmount || 0);
      ordersCount += 1;
    });
    rsOrders.forEach((o) => {
      totalRevenue += parseFloat(o.totalAmount || 0);
      ordersCount += 1;
    });
    (barOrders || []).forEach((o) => {
      totalRevenue += parseFloat(o.totalAmount || 0);
      ordersCount += 1;
    });

    const avgOrderValue = ordersCount > 0 ? totalRevenue / ordersCount : 0;

    let topItem = { name: '-', revenue: 0 };
    const itemTotals = {};
    [...restBills, ...rsOrders, ...(barOrders || [])].forEach((b) => {
      const items = collectItemsFromBill(b, 'restaurant');
      items.forEach((it) => {
        const amt = it.quantity * it.price;
        itemTotals[it.name] = (itemTotals[it.name] || 0) + amt;
      });
    });
    Object.entries(itemTotals).forEach(([name, rev]) => {
      if (rev > topItem.revenue) topItem = { name, revenue: rev };
    });

    res.json({
      totalRestaurantRevenue: totalRevenue,
      totalOrders: ordersCount,
      averageOrderValue: avgOrderValue,
      topSellingItem: topItem.name,
      topSellingItemRevenue: topItem.revenue,
      startDate,
      endDate,
    });
  } catch (error) {
    console.error('getRestaurantSalesSummary error:', error);
    res.status(500).json({ message: 'Failed to load restaurant sales summary', error: error.message });
  }
};

exports.getDailyRestaurantSales = async (req, res) => {
  try {
    const { RestaurantBill, RoomServiceOrder, BarOrder } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);

    const dateFilter = {
      createdAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] },
    };
    const [restBills, rsOrders, barOrders] = await Promise.all([
      RestaurantBill.findAll({ where: { ...dateFilter, status: { [Op.in]: ['Paid', 'On Hold'] } } }),
      RoomServiceOrder.findAll({ where: { ...dateFilter, status: { [Op.ne]: 'Cancelled' } } }),
      BarOrder ? BarOrder.findAll({ where: { ...dateFilter, status: { [Op.in]: ['Served', 'Ready'] } } }) : [],
    ]);

    const byDate = {};
    const addToDate = (d, amt, cnt = 1) => {
      const key = (d || '').toString().slice(0, 10);
      if (!key) return;
      if (!byDate[key]) byDate[key] = { date: key, totalSales: 0, totalOrders: 0 };
      byDate[key].totalSales += amt;
      byDate[key].totalOrders += cnt;
    };
    restBills.forEach((b) => addToDate(b.createdAt, parseFloat(b.totalAmount || 0)));
    rsOrders.forEach((o) => addToDate(o.createdAt, parseFloat(o.totalAmount || 0)));
    (barOrders || []).forEach((o) => addToDate(o.createdAt, parseFloat(o.totalAmount || 0)));

    const daily = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
    res.json({ daily });
  } catch (error) {
    console.error('getDailyRestaurantSales error:', error);
    res.status(500).json({ message: 'Failed to load daily sales', error: error.message });
  }
};

exports.getItemWiseSales = async (req, res) => {
  try {
    const { RestaurantBill, RoomServiceOrder, BarOrder, MenuItem, MenuCategory } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);

    const dateFilter = { createdAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] } };
    const [restBills, rsOrders, barOrders] = await Promise.all([
      RestaurantBill.findAll({ where: { ...dateFilter, status: { [Op.in]: ['Paid', 'On Hold'] } } }),
      RoomServiceOrder.findAll({ where: { ...dateFilter, status: { [Op.ne]: 'Cancelled' } } }),
      BarOrder ? BarOrder.findAll({ where: { ...dateFilter, status: { [Op.in]: ['Served', 'Ready'] } } }) : [],
    ]);

    const itemMap = {};
    const addItems = (bills, source) => {
      bills.forEach((b) => {
        const items = collectItemsFromBill(b, source);
        items.forEach((it) => {
          const key = it.name;
          if (!itemMap[key]) itemMap[key] = { itemName: key, quantitySold: 0, totalRevenue: 0 };
          itemMap[key].quantitySold += it.quantity;
          itemMap[key].totalRevenue += it.quantity * it.price;
        });
      });
    };
    addItems(restBills, 'restaurant');
    addItems(rsOrders, 'roomservice');
    addItems(barOrders || [], 'bar');

    const itemWise = Object.values(itemMap).sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0));
    res.json({ itemWise });
  } catch (error) {
    console.error('getItemWiseSales error:', error);
    res.status(500).json({ message: 'Failed to load item-wise sales', error: error.message });
  }
};

exports.getCategoryWiseSales = async (req, res) => {
  try {
    const { RestaurantBill, RoomServiceOrder, BarOrder, MenuItem, MenuCategory } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);

    const dateFilter = { createdAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] } };
    const [restBills, rsOrders, barOrders] = await Promise.all([
      RestaurantBill.findAll({ where: { ...dateFilter, status: { [Op.in]: ['Paid', 'On Hold'] } } }),
      RoomServiceOrder.findAll({ where: { ...dateFilter, status: { [Op.ne]: 'Cancelled' } } }),
      BarOrder ? BarOrder.findAll({ where: { ...dateFilter, status: { [Op.in]: ['Served', 'Ready'] } } }) : [],
    ]);

    let itemIdToCategory = {};
    try {
      const menuItems = await MenuItem.findAll();
      const catIds = [...new Set(menuItems.map((m) => m.categoryId).filter(Boolean))];
      const categories = catIds.length ? await MenuCategory.findAll({ where: { id: { [Op.in]: catIds } } }) : [];
      const catMap = {};
      categories.forEach((c) => { catMap[c.id] = c.name; });
      menuItems.forEach((m) => { itemIdToCategory[m.id] = catMap[m.categoryId] || 'Other'; });
    } catch (_) {
      itemIdToCategory = {};
    }

    const catMap = {};
    const addToCat = (bills) => {
      bills.forEach((b) => {
        const items = Array.isArray(b.items) ? b.items : [];
        items.forEach((it) => {
          const cat = itemIdToCategory[it.id] || 'Other';
          if (!catMap[cat]) catMap[cat] = { category: cat, revenue: 0, quantity: 0 };
          const qty = parseInt(it.quantity || 1, 10);
          const price = parseFloat(it.price || it.unitPrice || 0);
          catMap[cat].revenue += qty * price;
          catMap[cat].quantity += qty;
        });
      });
    };
    addToCat(restBills);
    addToCat(rsOrders);
    addToCat(barOrders || []);

    const categoryWise = Object.values(catMap).sort((a, b) => (b.revenue || 0) - (a.revenue || 0));
    res.json({ categoryWise });
  } catch (error) {
    console.error('getCategoryWiseSales error:', error);
    res.status(500).json({ message: 'Failed to load category-wise sales', error: error.message });
  }
};

exports.getTopSellingItems = async (req, res) => {
  try {
    const { RestaurantBill, RoomServiceOrder, BarOrder } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

    const dateFilter = { createdAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] } };
    const [restBills, rsOrders, barOrders] = await Promise.all([
      RestaurantBill.findAll({ where: { ...dateFilter, status: { [Op.in]: ['Paid', 'On Hold'] } } }),
      RoomServiceOrder.findAll({ where: { ...dateFilter, status: { [Op.ne]: 'Cancelled' } } }),
      BarOrder ? BarOrder.findAll({ where: { ...dateFilter, status: { [Op.in]: ['Served', 'Ready'] } } }) : [],
    ]);

    const itemMap = {};
    const addItems = (bills) => {
      bills.forEach((b) => {
        const items = collectItemsFromBill(b, 'restaurant');
        items.forEach((it) => {
          const key = it.name;
          if (!itemMap[key]) itemMap[key] = { itemName: key, unitsSold: 0, revenue: 0 };
          itemMap[key].unitsSold += it.quantity;
          itemMap[key].revenue += it.quantity * it.price;
        });
      });
    };
    addItems(restBills);
    addItems(rsOrders);
    addItems(barOrders || []);

    const topItems = Object.values(itemMap)
      .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
      .slice(0, limit);

    res.json({ topItems });
  } catch (error) {
    console.error('getTopSellingItems error:', error);
    res.status(500).json({ message: 'Failed to load top selling items', error: error.message });
  }
};

exports.getPaymentMethodAnalysis = async (req, res) => {
  try {
    const { RestaurantBill } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);

    const bills = await RestaurantBill.findAll({
      where: {
        status: { [Op.in]: ['Paid', 'On Hold'] },
        createdAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] },
      },
    });

    const byMethod = { Cash: 0, Card: 0, UPI: 0, Online: 0, Other: 0 };
    bills.forEach((b) => {
      const pay = b.payment && typeof b.payment === 'object' ? b.payment : {};
      const cash = parseFloat(pay.cashAmount || 0);
      const card = parseFloat(pay.cardAmount || 0);
      const upi = parseFloat(pay.upiAmount || 0);
      const method = (pay.method || '').toLowerCase();
      if (cash > 0) byMethod.Cash += cash;
      if (card > 0) byMethod.Card += card;
      if (upi > 0) byMethod.UPI += upi;
      if (method && !['cash', 'card', 'upi'].includes(method)) byMethod.Other += parseFloat(b.totalAmount || 0);
      else if (cash === 0 && card === 0 && upi === 0) byMethod.Other += parseFloat(b.totalAmount || 0);
    });

    const paymentAnalysis = Object.entries(byMethod)
      .filter(([, v]) => v > 0)
      .map(([method, amount]) => ({ method, amount }));

    res.json({ paymentAnalysis });
  } catch (error) {
    console.error('getPaymentMethodAnalysis error:', error);
    res.status(500).json({ message: 'Failed to load payment analysis', error: error.message });
  }
};

exports.getRestaurantSalesTrend = async (req, res) => {
  try {
    const { RestaurantBill, RoomServiceOrder, BarOrder } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);

    const dateFilter = { createdAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] } };
    const [restBills, rsOrders, barOrders] = await Promise.all([
      RestaurantBill.findAll({ where: { ...dateFilter, status: { [Op.in]: ['Paid', 'On Hold'] } } }),
      RoomServiceOrder.findAll({ where: { ...dateFilter, status: { [Op.ne]: 'Cancelled' } } }),
      BarOrder ? BarOrder.findAll({ where: { ...dateFilter, status: { [Op.in]: ['Served', 'Ready'] } } }) : [],
    ]);

    const byDate = {};
    const add = (list, amtKey) => {
      list.forEach((b) => {
        const d = (b.createdAt || '').toString().slice(0, 10);
        if (!d) return;
        byDate[d] = (byDate[d] || 0) + parseFloat(b[amtKey] || b.totalAmount || 0);
      });
    };
    add(restBills, 'totalAmount');
    add(rsOrders, 'totalAmount');
    add(barOrders || [], 'totalAmount');

    const trend = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, sales]) => ({ date, sales }));

    const itemMap = {};
    const addItems = (bills) => {
      bills.forEach((b) => {
        const items = collectItemsFromBill(b, 'restaurant');
        items.forEach((it) => {
          itemMap[it.name] = (itemMap[it.name] || 0) + it.quantity * it.price;
        });
      });
    };
    addItems(restBills);
    addItems(rsOrders);
    addItems(barOrders || []);
    const categorySales = Object.entries(itemMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const paymentMap = {};
    restBills.forEach((b) => {
      const pay = b.payment && typeof b.payment === 'object' ? b.payment : {};
      const m = (pay.method || 'Other').toString();
      paymentMap[m] = (paymentMap[m] || 0) + parseFloat(b.totalAmount || 0);
    });
    const paymentDistribution = Object.entries(paymentMap).map(([method, amount]) => ({ name: method, value: amount }));

    res.json({ trend, categorySales, paymentDistribution });
  } catch (error) {
    console.error('getRestaurantSalesTrend error:', error);
    res.status(500).json({ message: 'Failed to load sales trend', error: error.message });
  }
};

exports.exportRestaurantSalesReport = async (req, res) => {
  try {
    const { RestaurantBill, RoomServiceOrder, BarOrder } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);

    const dateFilter = { createdAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] } };
    const [restBills, rsOrders, barOrders] = await Promise.all([
      RestaurantBill.findAll({ where: { ...dateFilter, status: { [Op.in]: ['Paid', 'On Hold'] } } }),
      RoomServiceOrder.findAll({ where: { ...dateFilter, status: { [Op.ne]: 'Cancelled' } } }),
      BarOrder ? BarOrder.findAll({ where: { ...dateFilter, status: { [Op.in]: ['Served', 'Ready'] } } }) : [],
    ]);

    let totalRevenue = 0;
    let ordersCount = 0;
    const byDate = {};
    const itemMap = {};
    const paymentMap = { Cash: 0, Card: 0, UPI: 0, Other: 0 };

    const process = (list, source) => {
      list.forEach((b) => {
        const amt = parseFloat(b.totalAmount || 0);
        totalRevenue += amt;
        ordersCount += 1;
        const d = (b.createdAt || '').toString().slice(0, 10);
        if (d) byDate[d] = (byDate[d] || 0) + amt;
        const items = collectItemsFromBill(b, source);
        items.forEach((it) => {
          itemMap[it.name] = (itemMap[it.name] || { qty: 0, rev: 0 });
          itemMap[it.name].qty += it.quantity;
          itemMap[it.name].rev += it.quantity * it.price;
        });
        if (source === 'restaurant' && b.payment) {
          const p = b.payment;
          if (parseFloat(p.cashAmount || 0) > 0) paymentMap.Cash += parseFloat(p.cashAmount);
          if (parseFloat(p.cardAmount || 0) > 0) paymentMap.Card += parseFloat(p.cardAmount);
          if (parseFloat(p.upiAmount || 0) > 0) paymentMap.UPI += parseFloat(p.upiAmount);
        }
      });
    };
    process(restBills, 'restaurant');
    process(rsOrders, 'roomservice');
    process(barOrders || [], 'bar');

    const daily = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, sales]) => ({ date, totalSales: sales }));

    const itemWise = Object.entries(itemMap)
      .map(([name, v]) => ({ itemName: name, quantitySold: v.qty, totalRevenue: v.rev }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    const paymentAnalysis = Object.entries(paymentMap)
      .filter(([, v]) => v > 0)
      .map(([method, amount]) => ({ method, amount }));

    res.json({
      summary: {
        totalRestaurantRevenue: totalRevenue,
        totalOrders: ordersCount,
        averageOrderValue: ordersCount > 0 ? totalRevenue / ordersCount : 0,
      },
      daily,
      itemWise,
      paymentAnalysis,
      filters: { startDate, endDate },
    });
  } catch (error) {
    console.error('exportRestaurantSalesReport error:', error);
    res.status(500).json({ message: 'Failed to export report', error: error.message });
  }
};
