const { Op } = require('sequelize');

function parseDateRange(req) {
  const start = req.query.startDate || null;
  const end = req.query.endDate || null;
  const endDate = end ? new Date(end) : new Date();
  const startDate = start ? new Date(start) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { startDate: startDate.toISOString().slice(0, 10), endDate: endDate.toISOString().slice(0, 10) };
}

exports.getTaxSummary = async (req, res) => {
  try {
    const { RoomBill, RestaurantBill, Invoice } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);

    const dateFilter = { createdAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] } };
    const restDateFilter = { createdAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] } };
    const invDateFilter = { issueDate: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] } };

    const [roomBills, restBills, invoices] = await Promise.all([
      RoomBill.findAll({ where: { ...dateFilter, status: { [Op.in]: ['SETTLED', 'PENDING'] } } }),
      RestaurantBill.findAll({ where: { ...restDateFilter, status: { [Op.in]: ['Paid', 'On Hold'] } } }),
      Invoice ? Invoice.findAll({ where: invDateFilter }) : [],
    ]);

    let totalTaxCollected = 0;
    let gstVatCollected = 0;
    let serviceChargesCollected = 0;
    let totalTaxableRevenue = 0;

    roomBills.forEach((b) => {
      const tax = parseFloat(b.taxTotal || 0);
      const serviceCharge = parseFloat(b.serviceChargeAmount || 0);
      const taxable = parseFloat(b.taxableAmount || 0);
      totalTaxCollected += tax + serviceCharge;
      gstVatCollected += tax;
      serviceChargesCollected += serviceCharge;
      totalTaxableRevenue += taxable;
    });
    restBills.forEach((b) => {
      const tax = parseFloat(b.taxAmount || 0);
      const serviceCharge = parseFloat(b.serviceCharge || 0);
      totalTaxCollected += tax + serviceCharge;
      gstVatCollected += tax;
      serviceChargesCollected += serviceCharge;
      totalTaxableRevenue += parseFloat(b.subtotal || 0) - parseFloat(b.discountAmount || 0);
    });
    (invoices || []).forEach((inv) => {
      const tax = parseFloat(inv.taxAmount || 0);
      totalTaxCollected += tax;
      gstVatCollected += tax;
      totalTaxableRevenue += parseFloat(inv.subtotal || inv.amount || 0);
    });

    res.json({
      totalTaxCollected,
      gstVatCollected,
      serviceChargesCollected,
      totalTaxableRevenue,
      taxPercentage: totalTaxableRevenue > 0 ? (totalTaxCollected / totalTaxableRevenue) * 100 : 0,
      startDate,
      endDate,
    });
  } catch (error) {
    console.error('getTaxSummary error:', error);
    res.status(500).json({ message: 'Failed to load tax summary', error: error.message });
  }
};

exports.getGSTVATReport = async (req, res) => {
  try {
    const { RoomBill, RestaurantBill, Invoice } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);

    const dateFilter = { createdAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] } };

    const [roomBills, restBills, invoices] = await Promise.all([
      RoomBill.findAll({ where: { ...dateFilter, status: { [Op.in]: ['SETTLED', 'PENDING'] } } }),
      RestaurantBill.findAll({ where: { ...dateFilter, status: { [Op.in]: ['Paid', 'On Hold'] } } }),
      Invoice ? Invoice.findAll({ where: { issueDate: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] } } }) : [],
    ]);

    let invoiceCount = 0;
    let totalTaxAmount = 0;
    let taxableSales = 0;
    const gstBreakdown = { cgst: 0, sgst: 0, igst: 0 };

    roomBills.forEach((b) => {
      invoiceCount += 1;
      totalTaxAmount += parseFloat(b.taxTotal || 0);
      taxableSales += parseFloat(b.taxableAmount || 0);
      gstBreakdown.cgst += parseFloat(b.cgst || 0);
      gstBreakdown.sgst += parseFloat(b.sgst || 0);
      gstBreakdown.igst += parseFloat(b.igst || 0);
    });
    restBills.forEach((b) => {
      invoiceCount += 1;
      totalTaxAmount += parseFloat(b.taxAmount || 0);
      const tb = b.taxBreakdown && typeof b.taxBreakdown === 'object' ? b.taxBreakdown : {};
      taxableSales += parseFloat(tb.taxableAmount || b.subtotal || 0) - parseFloat(b.discountAmount || 0);
      gstBreakdown.cgst += parseFloat(tb.cgst || 0);
      gstBreakdown.sgst += parseFloat(tb.sgst || 0);
      gstBreakdown.igst += parseFloat(tb.igst || 0);
    });
    (invoices || []).forEach((inv) => {
      invoiceCount += 1;
      totalTaxAmount += parseFloat(inv.taxAmount || 0);
      taxableSales += parseFloat(inv.subtotal || inv.amount || 0);
    });

    res.json({
      invoiceCount,
      totalTaxAmount,
      taxableSales,
      gstBreakdown,
      startDate,
      endDate,
    });
  } catch (error) {
    console.error('getGSTVATReport error:', error);
    res.status(500).json({ message: 'Failed to load GST/VAT report', error: error.message });
  }
};

exports.getServiceChargeReport = async (req, res) => {
  try {
    const { RoomBill, RestaurantBill } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);

    const dateFilter = { createdAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] } };

    const [roomBills, restBills] = await Promise.all([
      RoomBill.findAll({ where: { ...dateFilter, status: { [Op.in]: ['SETTLED', 'PENDING'] } } }),
      RestaurantBill.findAll({ where: { ...dateFilter, status: { [Op.in]: ['Paid', 'On Hold'] } } }),
    ]);

    let totalServiceCharges = 0;
    let serviceChargeRevenue = 0;
    const rates = {};

    roomBills.forEach((b) => {
      const amt = parseFloat(b.serviceChargeAmount || 0);
      totalServiceCharges += amt;
      serviceChargeRevenue += amt;
      const rate = parseFloat(b.serviceChargePercent || 0);
      if (rate > 0) rates[`${rate}%`] = (rates[`${rate}%`] || 0) + amt;
    });
    restBills.forEach((b) => {
      const amt = parseFloat(b.serviceCharge || 0);
      totalServiceCharges += amt;
      serviceChargeRevenue += amt;
    });

    res.json({
      totalServiceCharges,
      serviceChargeRevenue,
      rates: Object.entries(rates).map(([rate, amount]) => ({ rate, amount })),
      startDate,
      endDate,
    });
  } catch (error) {
    console.error('getServiceChargeReport error:', error);
    res.status(500).json({ message: 'Failed to load service charge report', error: error.message });
  }
};

exports.getTaxBreakdownByInvoice = async (req, res) => {
  try {
    const { RoomBill, RestaurantBill, Invoice } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);

    const dateFilter = { createdAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] } };

    const [roomBills, restBills, invoices] = await Promise.all([
      RoomBill.findAll({ where: { ...dateFilter, status: { [Op.in]: ['SETTLED', 'PENDING'] } }, order: [['createdAt', 'DESC']], limit: 100 }),
      RestaurantBill.findAll({ where: { ...dateFilter, status: { [Op.in]: ['Paid', 'On Hold'] } }, order: [['createdAt', 'DESC']], limit: 100 }),
      Invoice ? Invoice.findAll({ where: { issueDate: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] } }, order: [['issueDate', 'DESC']], limit: 50 }) : [],
    ]);

    const breakdown = [];
    roomBills.forEach((b) => {
      breakdown.push({
        invoiceNumber: b.billNumber,
        customerName: b.guestName,
        source: 'Room Bill',
        taxAmount: parseFloat(b.taxTotal || 0),
        serviceCharge: parseFloat(b.serviceChargeAmount || 0),
        taxableAmount: parseFloat(b.taxableAmount || 0),
        grandTotal: parseFloat(b.grandTotal || 0),
        date: (b.createdAt || '').toString().slice(0, 10),
      });
    });
    restBills.forEach((b) => {
      breakdown.push({
        invoiceNumber: b.billNumber || b.id,
        customerName: b.guestName || b.customerPhone || '-',
        source: 'Restaurant',
        taxAmount: parseFloat(b.taxAmount || 0),
        serviceCharge: parseFloat(b.serviceCharge || 0),
        taxableAmount: parseFloat(b.subtotal || 0) - parseFloat(b.discountAmount || 0),
        grandTotal: parseFloat(b.totalAmount || 0),
        date: (b.createdAt || '').toString().slice(0, 10),
      });
    });
    (invoices || []).forEach((inv) => {
      breakdown.push({
        invoiceNumber: inv.invoiceNumber || inv.id,
        customerName: inv.customerName || inv.guestName || '-',
        source: 'Invoice',
        taxAmount: parseFloat(inv.taxAmount || 0),
        serviceCharge: 0,
        taxableAmount: parseFloat(inv.subtotal || inv.amount || 0),
        grandTotal: parseFloat(inv.totalAmount || inv.amount || 0),
        date: (inv.issueDate || inv.createdAt || '').toString().slice(0, 10),
      });
    });

    breakdown.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    res.json({ breakdown: breakdown.slice(0, 150) });
  } catch (error) {
    console.error('getTaxBreakdownByInvoice error:', error);
    res.status(500).json({ message: 'Failed to load tax breakdown', error: error.message });
  }
};

exports.getTaxFilingReport = async (req, res) => {
  try {
    const { RoomBill, RestaurantBill } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);

    const [roomBills, restBills] = await Promise.all([
      RoomBill.findAll({
        where: {
          status: { [Op.in]: ['SETTLED', 'PENDING'] },
          createdAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] },
        },
      }),
      RestaurantBill.findAll({
        where: {
          status: { [Op.in]: ['Paid', 'On Hold'] },
          createdAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] },
        },
      }),
    ]);

    const monthMap = {};
    const addToMonth = (date, tax, serviceCharge) => {
      const d = new Date(date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap[key]) monthMap[key] = { month: key, gstVat: 0, serviceCharge: 0, taxPayable: 0 };
      monthMap[key].gstVat += tax;
      monthMap[key].serviceCharge += serviceCharge;
      monthMap[key].taxPayable += tax;
    };

    roomBills.forEach((b) => addToMonth(b.createdAt, parseFloat(b.taxTotal || 0), parseFloat(b.serviceChargeAmount || 0)));
    restBills.forEach((b) => addToMonth(b.createdAt, parseFloat(b.taxAmount || 0), parseFloat(b.serviceCharge || 0)));

    const monthlySummary = Object.values(monthMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((m) => ({
        ...m,
        monthLabel: new Date(m.month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' }),
      }));

    const totalTaxPayable = Object.values(monthMap).reduce((s, m) => s + (m.taxPayable || 0), 0);

    res.json({
      monthlySummary,
      totalTaxPayable,
      filingPeriod: { startDate, endDate },
    });
  } catch (error) {
    console.error('getTaxFilingReport error:', error);
    res.status(500).json({ message: 'Failed to load tax filing report', error: error.message });
  }
};

exports.getTaxTrend = async (req, res) => {
  try {
    const { RoomBill, RestaurantBill, Invoice } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);

    const dateFilter = { createdAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] } };

    const [roomBills, restBills, invoices] = await Promise.all([
      RoomBill.findAll({ where: { ...dateFilter, status: { [Op.in]: ['SETTLED', 'PENDING'] } } }),
      RestaurantBill.findAll({ where: { ...dateFilter, status: { [Op.in]: ['Paid', 'On Hold'] } } }),
      Invoice ? Invoice.findAll({ where: { issueDate: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] } } }) : [],
    ]);

    const byDate = {};
    const add = (list, getTax, getServiceCharge) => {
      list.forEach((b) => {
        const d = (b.createdAt || b.issueDate || '').toString().slice(0, 10);
        if (!d) return;
        if (!byDate[d]) byDate[d] = { date: d, tax: 0, serviceCharge: 0, taxable: 0 };
        byDate[d].tax += getTax(b);
        byDate[d].serviceCharge += getServiceCharge ? getServiceCharge(b) : 0;
      });
    };
    add(roomBills, (b) => parseFloat(b.taxTotal || 0), (b) => parseFloat(b.serviceChargeAmount || 0));
    add(restBills, (b) => parseFloat(b.taxAmount || 0), (b) => parseFloat(b.serviceCharge || 0));
    add(invoices || [], (b) => parseFloat(b.taxAmount || 0));

    const trend = Object.values(byDate)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((r) => ({ date: r.date, tax: r.tax, serviceCharge: r.serviceCharge, total: r.tax + r.serviceCharge }));

    const taxByType = { GST: 0, 'Service Charge': 0 };
    roomBills.forEach((b) => {
      taxByType.GST += parseFloat(b.taxTotal || 0);
      taxByType['Service Charge'] += parseFloat(b.serviceChargeAmount || 0);
    });
    restBills.forEach((b) => {
      taxByType.GST += parseFloat(b.taxAmount || 0);
      taxByType['Service Charge'] += parseFloat(b.serviceCharge || 0);
    });

    const taxDistribution = Object.entries(taxByType)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));

    res.json({ trend, taxDistribution });
  } catch (error) {
    console.error('getTaxTrend error:', error);
    res.status(500).json({ message: 'Failed to load tax trend', error: error.message });
  }
};

exports.exportTaxReport = async (req, res) => {
  try {
    const { RoomBill, RestaurantBill, Invoice } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);

    const dateFilter = { createdAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] } };

    const [roomBills, restBills, invoices] = await Promise.all([
      RoomBill.findAll({ where: { ...dateFilter, status: { [Op.in]: ['SETTLED', 'PENDING'] } } }),
      RestaurantBill.findAll({ where: { ...dateFilter, status: { [Op.in]: ['Paid', 'On Hold'] } } }),
      Invoice ? Invoice.findAll({ where: { issueDate: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] } } }) : [],
    ]);

    let totalTaxCollected = 0;
    let gstVatCollected = 0;
    let serviceChargesCollected = 0;
    let totalTaxableRevenue = 0;

    roomBills.forEach((b) => {
      totalTaxCollected += parseFloat(b.taxTotal || 0) + parseFloat(b.serviceChargeAmount || 0);
      gstVatCollected += parseFloat(b.taxTotal || 0);
      serviceChargesCollected += parseFloat(b.serviceChargeAmount || 0);
      totalTaxableRevenue += parseFloat(b.taxableAmount || 0);
    });
    restBills.forEach((b) => {
      totalTaxCollected += parseFloat(b.taxAmount || 0) + parseFloat(b.serviceCharge || 0);
      gstVatCollected += parseFloat(b.taxAmount || 0);
      serviceChargesCollected += parseFloat(b.serviceCharge || 0);
      totalTaxableRevenue += parseFloat(b.subtotal || 0) - parseFloat(b.discountAmount || 0);
    });
    (invoices || []).forEach((inv) => {
      totalTaxCollected += parseFloat(inv.taxAmount || 0);
      gstVatCollected += parseFloat(inv.taxAmount || 0);
      totalTaxableRevenue += parseFloat(inv.subtotal || inv.amount || 0);
    });

    const breakdown = [];
    roomBills.forEach((b) => {
      breakdown.push({
        invoiceNumber: b.billNumber,
        customerName: b.guestName,
        source: 'Room Bill',
        taxAmount: parseFloat(b.taxTotal || 0),
        serviceCharge: parseFloat(b.serviceChargeAmount || 0),
        date: (b.createdAt || '').toString().slice(0, 10),
      });
    });
    restBills.forEach((b) => {
      breakdown.push({
        invoiceNumber: b.billNumber || b.id,
        customerName: b.guestName || b.customerPhone || '-',
        source: 'Restaurant',
        taxAmount: parseFloat(b.taxAmount || 0),
        serviceCharge: parseFloat(b.serviceCharge || 0),
        date: (b.createdAt || '').toString().slice(0, 10),
      });
    });

    res.json({
      summary: {
        totalTaxCollected,
        gstVatCollected,
        serviceChargesCollected,
        totalTaxableRevenue,
      },
      breakdown: breakdown.slice(0, 200),
      filters: { startDate, endDate },
    });
  } catch (error) {
    console.error('exportTaxReport error:', error);
    res.status(500).json({ message: 'Failed to export tax report', error: error.message });
  }
};
