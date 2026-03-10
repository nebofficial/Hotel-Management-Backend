const { Op } = require('sequelize');

function parseDateRange(req) {
  const start = req.query.startDate || null;
  const end = req.query.endDate || null;
  const endDate = end ? new Date(end) : new Date();
  const startDate = start ? new Date(start) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { startDate: startDate.toISOString().slice(0, 10), endDate: endDate.toISOString().slice(0, 10) };
}

function buildExpenseWhere(req) {
  const { startDate, endDate } = parseDateRange(req);
  const category = req.query.category || null;
  const department = req.query.department || null;
  const vendor = req.query.vendor || null;

  const where = {
    expenseDate: { [Op.between]: [startDate, endDate] },
    status: { [Op.in]: ['Paid', 'Pending'] },
  };
  if (category) where.category = category;
  if (department) where.category = department; // using category as department proxy
  if (vendor) where.vendor = { [Op.iLike]: `%${vendor}%` };
  return { where, startDate, endDate };
}

exports.getExpenseSummary = async (req, res) => {
  try {
    const { Expense } = req.hotelModels;
    const { where, startDate, endDate } = buildExpenseWhere(req);

    const expenses = await Expense.findAll({ where });

    let totalExpenses = 0;
    let totalVendorPayments = 0;
    let operationalCosts = 0;
    let maintenanceExpenses = 0;

    const catMap = { Salary: 'operational', Utilities: 'operational', Supplies: 'operational', Marketing: 'operational', Other: 'operational', Maintenance: 'maintenance' };

    expenses.forEach((e) => {
      const amt = parseFloat(e.amount || 0);
      totalExpenses += amt;
      if (e.vendor) totalVendorPayments += amt;
      if (catMap[e.category] === 'operational') operationalCosts += amt;
      if (e.category === 'Maintenance') maintenanceExpenses += amt;
    });

    res.json({
      totalExpenses,
      totalVendorPayments,
      operationalCosts,
      maintenanceExpenses,
      expenseCount: expenses.length,
      startDate,
      endDate,
    });
  } catch (error) {
    console.error('getExpenseSummary error:', error);
    res.status(500).json({ message: 'Failed to load expense summary', error: error.message });
  }
};

exports.getDailyExpenses = async (req, res) => {
  try {
    const { Expense } = req.hotelModels;
    const { where, startDate, endDate } = buildExpenseWhere(req);

    const expenses = await Expense.findAll({ where, order: [['expenseDate', 'DESC']] });

    const byDate = {};
    expenses.forEach((e) => {
      const d = (e.expenseDate || '').toString().slice(0, 10);
      if (!byDate[d]) byDate[d] = { date: d, total: 0, items: [] };
      const amt = parseFloat(e.amount || 0);
      byDate[d].total += amt;
      byDate[d].items.push({
        category: e.category,
        amount: amt,
        paymentMethod: e.paymentMethod,
        vendor: e.vendor,
      });
    });

    const daily = Object.values(byDate).sort((a, b) => b.date.localeCompare(a.date));

    res.json({ daily, startDate, endDate });
  } catch (error) {
    console.error('getDailyExpenses error:', error);
    res.status(500).json({ message: 'Failed to load daily expenses', error: error.message });
  }
};

exports.getMonthlyExpenses = async (req, res) => {
  try {
    const { Expense } = req.hotelModels;
    const { where, startDate, endDate } = buildExpenseWhere(req);

    const expenses = await Expense.findAll({ where });

    const byMonth = {};
    expenses.forEach((e) => {
      const d = new Date(e.expenseDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[key]) byMonth[key] = { month: key, total: 0, byCategory: {} };
      const amt = parseFloat(e.amount || 0);
      byMonth[key].total += amt;
      byMonth[key].byCategory[e.category || 'Other'] = (byMonth[key].byCategory[e.category || 'Other'] || 0) + amt;
    });

    const monthly = Object.values(byMonth)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((m) => ({
        ...m,
        monthLabel: new Date(m.month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' }),
      }));

    res.json({ monthly, startDate, endDate });
  } catch (error) {
    console.error('getMonthlyExpenses error:', error);
    res.status(500).json({ message: 'Failed to load monthly expenses', error: error.message });
  }
};

exports.getDepartmentExpenses = async (req, res) => {
  try {
    const { Expense } = req.hotelModels;
    const { where, startDate, endDate } = buildExpenseWhere(req);

    const expenses = await Expense.findAll({ where });

    const byDept = {};
    expenses.forEach((e) => {
      const dept = e.category || 'Other';
      if (!byDept[dept]) byDept[dept] = { department: dept, total: 0, count: 0 };
      byDept[dept].total += parseFloat(e.amount || 0);
      byDept[dept].count += 1;
    });

    const departmentExpenses = Object.values(byDept).sort((a, b) => b.total - a.total);

    res.json({ departmentExpenses, startDate, endDate });
  } catch (error) {
    console.error('getDepartmentExpenses error:', error);
    res.status(500).json({ message: 'Failed to load department expenses', error: error.message });
  }
};

exports.getVendorPayments = async (req, res) => {
  try {
    const { Expense } = req.hotelModels;
    const { where, startDate, endDate } = buildExpenseWhere(req);

    const vendorWhere = { ...where, vendor: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] } };
    const expenses = await Expense.findAll({
      where: vendorWhere,
      order: [['expenseDate', 'DESC']],
    });

    const vendorPayments = expenses.map((e) => ({
      vendorName: e.vendor,
      invoiceNumber: e.description?.slice(0, 30) || '-',
      paymentAmount: parseFloat(e.amount || 0),
      paymentDate: (e.expenseDate || '').toString().slice(0, 10),
      category: e.category,
    }));

    res.json({ vendorPayments, startDate, endDate });
  } catch (error) {
    console.error('getVendorPayments error:', error);
    res.status(500).json({ message: 'Failed to load vendor payments', error: error.message });
  }
};

exports.getExpenseTrend = async (req, res) => {
  try {
    const { Expense } = req.hotelModels;
    const { where, startDate, endDate } = buildExpenseWhere(req);

    const expenses = await Expense.findAll({ where });

    const byDate = {};
    expenses.forEach((e) => {
      const d = (e.expenseDate || '').toString().slice(0, 10);
      if (!byDate[d]) byDate[d] = { date: d, total: 0, byCategory: {} };
      const amt = parseFloat(e.amount || 0);
      byDate[d].total += amt;
      byDate[d].byCategory[e.category || 'Other'] = (byDate[d].byCategory[e.category || 'Other'] || 0) + amt;
    });

    const trend = Object.values(byDate)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((r) => ({ date: r.date, total: r.total }));

    const byCategory = {};
    expenses.forEach((e) => {
      const cat = e.category || 'Other';
      byCategory[cat] = (byCategory[cat] || 0) + parseFloat(e.amount || 0);
    });
    const categoryDistribution = Object.entries(byCategory).map(([name, value]) => ({ name, value }));

    res.json({ trend, categoryDistribution, departmentExpenses: Object.entries(byCategory).map(([name, value]) => ({ name, value })), startDate, endDate });
  } catch (error) {
    console.error('getExpenseTrend error:', error);
    res.status(500).json({ message: 'Failed to load expense trend', error: error.message });
  }
};

exports.getExpenseDetails = async (req, res) => {
  try {
    const { Expense } = req.hotelModels;
    const { where, startDate, endDate } = buildExpenseWhere(req);

    const expenses = await Expense.findAll({
      where,
      order: [['expenseDate', 'DESC'], ['createdAt', 'DESC']],
      limit: 150,
    });

    const breakdown = expenses.map((e) => ({
      date: (e.expenseDate || '').toString().slice(0, 10),
      category: e.category,
      amount: parseFloat(e.amount || 0),
      vendor: e.vendor,
      paymentMethod: e.paymentMethod,
      description: (e.description || '').slice(0, 80),
    }));

    res.json({ breakdown, startDate, endDate });
  } catch (error) {
    console.error('getExpenseDetails error:', error);
    res.status(500).json({ message: 'Failed to load expense details', error: error.message });
  }
};

exports.exportExpenseReport = async (req, res) => {
  try {
    const { Expense } = req.hotelModels;
    const { where, startDate, endDate } = buildExpenseWhere(req);

    const expenses = await Expense.findAll({ where, order: [['expenseDate', 'DESC']] });

    let totalExpenses = 0;
    let totalVendorPayments = 0;
    const byCategory = {};

    expenses.forEach((e) => {
      const amt = parseFloat(e.amount || 0);
      totalExpenses += amt;
      if (e.vendor) totalVendorPayments += amt;
      const cat = e.category || 'Other';
      byCategory[cat] = (byCategory[cat] || 0) + amt;
    });

    const breakdown = expenses.slice(0, 200).map((e) => ({
      date: (e.expenseDate || '').toString().slice(0, 10),
      category: e.category,
      amount: parseFloat(e.amount || 0),
      vendor: e.vendor,
      paymentMethod: e.paymentMethod,
      description: (e.description || '').slice(0, 80),
    }));

    res.json({
      summary: {
        totalExpenses,
        totalVendorPayments,
        expenseCount: expenses.length,
      },
      byCategory: Object.entries(byCategory).map(([name, value]) => ({ name, value })),
      breakdown,
      filters: { startDate, endDate },
    });
  } catch (error) {
    console.error('exportExpenseReport error:', error);
    res.status(500).json({ message: 'Failed to export expense report', error: error.message });
  }
};
