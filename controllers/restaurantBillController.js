const { Op } = require('sequelize');
const { getNextRestaurantBillNumber } = require('../utils/billNumberGenerator');
const { calculateGST } = require('../utils/gstCalculator');
const { validateDiscount } = require('../utils/discountValidator');
const { getNextKOTNumber, buildKOTItems } = require('../utils/kotGenerator');

function toJson(model) {
  if (!model) return null;
  const d = model.get ? model.get({ plain: true }) : model;
  return JSON.parse(JSON.stringify(d));
}

async function getStats(req, res) {
  try {
    const { RestaurantBill } = req.hotelModels;
    await RestaurantBill.sync({ alter: false });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where = { createdAt: { [Op.gte]: today, [Op.lt]: tomorrow } };

    const bills = await RestaurantBill.findAll({ where });
    const totalBills = bills.length;
    const totalRevenue = bills
      .filter((b) => b.status === 'Paid')
      .reduce((s, b) => s + Number(b.totalAmount || 0), 0);
    const pendingCount = bills.filter((b) => b.status === 'Pending' || b.status === 'On Hold').length;
    const refundedCount = bills.filter((b) => b.status === 'Refunded').length;

    res.json({
      totalBillsToday: totalBills,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      pendingSettlements: pendingCount,
      refundedBills: refundedCount,
    });
  } catch (error) {
    console.error('getStats error:', error);
    res.status(500).json({ message: 'Failed to get stats', error: error.message });
  }
}

async function getNextBillNumber(req, res) {
  try {
    const { RestaurantBill } = req.hotelModels;
    const billNumber = await getNextRestaurantBillNumber(RestaurantBill);
    res.json({ billNumber });
  } catch (error) {
    console.error('getNextBillNumber error:', error);
    res.status(500).json({ message: 'Failed to get bill number', error: error.message });
  }
}

async function createBill(req, res) {
  try {
    const { RestaurantBill } = req.hotelModels;
    await RestaurantBill.sync({ alter: false });

    const {
      orderType = 'Dine-in',
      tableNo,
      guestName,
      customerPhone,
      items = [],
      customerName,
    } = req.body || {};

    const billNumber = await getNextRestaurantBillNumber(RestaurantBill);
    const table = orderType === 'Dine-in' ? (tableNo || 'T-01') : orderType;
    const name = guestName || customerName || null;

    const subtotal = (items || []).reduce(
      (s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 1),
      0
    );
    const taxResult = calculateGST(subtotal, 12, 5, 1);
    const totalAmount = taxResult.grossTotal;

    const bill = await RestaurantBill.create({
      billNumber,
      orderType: ['Dine-in', 'Takeaway', 'Delivery'].includes(orderType) ? orderType : 'Dine-in',
      tableNo: String(table),
      guestName: name,
      customerPhone: customerPhone || null,
      items: items || [],
      subtotal,
      discountAmount: 0,
      taxAmount: taxResult.totalTax,
      serviceCharge: taxResult.serviceCharge,
      roundOff: taxResult.roundOff,
      totalAmount,
      status: 'Pending',
      payment: {},
      taxBreakdown: taxResult,
    });

    res.status(201).json({ bill: toJson(bill) });
  } catch (error) {
    console.error('createBill error:', error);
    res.status(500).json({ message: 'Failed to create bill', error: error.message });
  }
}

async function addItemToBill(req, res) {
  try {
    const { RestaurantBill } = req.hotelModels;
    const { id: billId } = req.params;
    const { item } = req.body || {};

    if (!item?.id || !item?.name) {
      return res.status(400).json({ message: 'Item must have id and name' });
    }

    const bill = await RestaurantBill.findByPk(billId);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    if (bill.status !== 'Pending' && bill.status !== 'On Hold') {
      return res.status(400).json({ message: 'Cannot add items to settled bill' });
    }

    const items = Array.isArray(bill.items) ? [...bill.items] : [];
    const price = Number(item.price) || 0;
    const qty = Number(item.quantity) || 1;
    const existing = items.find((i) => i.id === item.id && !i.notes);
    if (existing) {
      existing.quantity = (existing.quantity || 1) + qty;
    } else {
      items.push({
        id: item.id,
        name: item.name,
        price,
        quantity: qty,
        taxRate: item.taxRate ?? 12,
        notes: item.notes || '',
      });
    }

    const subtotal = items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);
    const discountAmount = Number(bill.discountAmount) || 0;
    const taxableAmount = Math.max(subtotal - discountAmount, 0);
    const taxResult = calculateGST(taxableAmount, 12, 5, 1);

    bill.items = items;
    bill.subtotal = subtotal;
    bill.taxAmount = taxResult.totalTax;
    bill.serviceCharge = taxResult.serviceCharge;
    bill.roundOff = taxResult.roundOff;
    bill.totalAmount = taxResult.grossTotal;
    bill.taxBreakdown = taxResult;
    await bill.save();

    res.json({ bill: toJson(bill) });
  } catch (error) {
    console.error('addItemToBill error:', error);
    res.status(500).json({ message: 'Failed to add item', error: error.message });
  }
}

async function applyDiscount(req, res) {
  try {
    const { RestaurantBill } = req.hotelModels;
    const { id: billId } = req.params;
    const { discountAmount, discountPercent, managerApproved, managerPin } = req.body || {};

    const bill = await RestaurantBill.findByPk(billId);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    if (bill.status !== 'Pending' && bill.status !== 'On Hold') {
      return res.status(400).json({ message: 'Cannot modify settled bill' });
    }

    const subtotal = Number(bill.subtotal) || 0;
    const validation = validateDiscount(subtotal, discountAmount, discountPercent);
    if (!validation.ok) {
      return res.status(400).json({ message: validation.message });
    }
    if (validation.requiresApproval && !managerApproved) {
      return res.status(403).json({
        message: validation.message,
        requiresApproval: true,
        effectiveAmount: validation.effectiveAmount,
      });
    }

    const discount = validation.effectiveAmount;
    const taxableAmount = Math.max(subtotal - discount, 0);
    const taxResult = calculateGST(taxableAmount, 12, 5, 1);

    bill.discountAmount = discount;
    bill.taxAmount = taxResult.totalTax;
    bill.serviceCharge = taxResult.serviceCharge;
    bill.roundOff = taxResult.roundOff;
    bill.totalAmount = taxResult.grossTotal;
    bill.taxBreakdown = taxResult;
    await bill.save();

    res.json({ bill: toJson(bill) });
  } catch (error) {
    console.error('applyDiscount error:', error);
    res.status(500).json({ message: 'Failed to apply discount', error: error.message });
  }
}

async function generateKOT(req, res) {
  try {
    const { RestaurantBill, KitchenKOT } = req.hotelModels;
    await KitchenKOT.sync({ alter: false });

    const { id: billId } = req.params;

    const bill = await RestaurantBill.findByPk(billId);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });

    const kotNumber = await getNextKOTNumber(KitchenKOT);
    const kotItems = buildKOTItems(bill.items || []);

    const kot = await KitchenKOT.create({
      kotNumber,
      billId: bill.id,
      tableNo: bill.tableNo,
      guestName: bill.guestName,
      items: kotItems,
      section: 'All',
      status: 'Pending',
      autoGenerated: true,
    });

    res.status(201).json({ kot: toJson(kot), message: 'KOT generated successfully' });
  } catch (error) {
    console.error('generateKOT error:', error);
    res.status(500).json({ message: 'Failed to generate KOT', error: error.message });
  }
}

async function settleBill(req, res) {
  try {
    const { RestaurantBill, RestaurantTable } = req.hotelModels;
    const { id: billId } = req.params;
    const { payments = [], paymentMode } = req.body || {};

    const bill = await RestaurantBill.findByPk(billId);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    if (bill.status === 'Paid') {
      return res.status(400).json({ message: 'Bill already settled' });
    }
    if (bill.status === 'Cancelled' || bill.status === 'Refunded') {
      return res.status(400).json({ message: 'Cannot settle cancelled/refunded bill' });
    }

    const totalAmount = Number(bill.totalAmount) || 0;
    let paidTotal = 0;
    const paymentBreakdown = { cash: 0, card: 0, upi: 0, bank_transfer: 0 };

    if (Array.isArray(payments) && payments.length > 0) {
      payments.forEach((p) => {
        const amt = Number(p.amount) || 0;
        paidTotal += amt;
        const m = (p.method || paymentMode || 'cash').toLowerCase();
        if (m.includes('card')) paymentBreakdown.card += amt;
        else if (m.includes('upi')) paymentBreakdown.upi += amt;
        else if (m.includes('bank') || m.includes('transfer')) paymentBreakdown.bank_transfer += amt;
        else paymentBreakdown.cash += amt;
      });
    } else if (paymentMode) {
      paidTotal = totalAmount;
      const m = String(paymentMode).toLowerCase();
      if (m.includes('card')) paymentBreakdown.card = totalAmount;
      else if (m.includes('upi')) paymentBreakdown.upi = totalAmount;
      else paymentBreakdown.cash = totalAmount;
    } else {
      paidTotal = totalAmount;
      paymentBreakdown.cash = totalAmount;
    }

    if (paidTotal < totalAmount - 0.01) {
      return res.status(400).json({
        message: `Payment insufficient. Required: ₹${totalAmount}, Received: ₹${paidTotal}`,
      });
    }

    bill.status = 'Paid';
    bill.payment = { ...paymentBreakdown, totalPaid: paidTotal };
    await bill.save();

    if (RestaurantTable && bill.orderType === 'Dine-in' && bill.tableNo) {
      const table = await RestaurantTable.findOne({ where: { tableNo: bill.tableNo } });
      if (table && table.status === 'Occupied') {
        table.status = 'Available';
        table.currentGuestName = null;
        table.currentGuestPhone = null;
        await table.save();
      }
    }

    res.json({ bill: toJson(bill), message: 'Bill settled successfully' });
  } catch (error) {
    console.error('settleBill error:', error);
    res.status(500).json({ message: 'Failed to settle bill', error: error.message });
  }
}

async function processRefund(req, res) {
  try {
    const { RestaurantBill } = req.hotelModels;
    const { id: billId } = req.params;
    const { refundAmount, reason, refundMode, managerApproved } = req.body || {};

    const bill = await RestaurantBill.findByPk(billId);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    if (bill.status !== 'Paid') {
      return res.status(400).json({ message: 'Only paid bills can be refunded' });
    }

    const totalAmount = Number(bill.totalAmount) || 0;
    const amount = Number(refundAmount) || totalAmount;
    if (amount <= 0 || amount > totalAmount) {
      return res.status(400).json({ message: 'Invalid refund amount' });
    }

    bill.status = 'Refunded';
    bill.refundReason = reason || 'Customer request';
    bill.refundedAmount = amount;
    bill.refundedBy = managerApproved ? 'Manager' : 'Staff';
    await bill.save();

    res.json({ bill: toJson(bill), message: 'Refund processed successfully' });
  } catch (error) {
    console.error('processRefund error:', error);
    res.status(500).json({ message: 'Failed to process refund', error: error.message });
  }
}

async function getBill(req, res) {
  try {
    const { RestaurantBill } = req.hotelModels;
    const { id: billId } = req.params;

    const bill = await RestaurantBill.findByPk(billId);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });

    res.json({ bill: toJson(bill) });
  } catch (error) {
    console.error('getBill error:', error);
    res.status(500).json({ message: 'Failed to get bill', error: error.message });
  }
}

async function listBills(req, res) {
  try {
    const { RestaurantBill } = req.hotelModels;
    const { status, tableNo, date } = req.query || {};

    const where = {};
    if (status) where.status = status;
    if (tableNo) where.tableNo = tableNo;
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setDate(end.getDate() + 1);
      where.createdAt = { [Op.gte]: d, [Op.lt]: end };
    }

    const bills = await RestaurantBill.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    res.json({ bills: bills.map(b => toJson(b)) });
  } catch (error) {
    console.error('listBills error:', error);
    res.status(500).json({ message: 'Failed to list bills', error: error.message });
  }
}

async function cancelBill(req, res) {
  try {
    const { RestaurantBill } = req.hotelModels;
    const { id: billId } = req.params;

    const bill = await RestaurantBill.findByPk(billId);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    if (bill.status === 'Paid') {
      return res.status(400).json({ message: 'Cannot cancel paid bill. Use refund instead.' });
    }

    bill.status = 'Cancelled';
    await bill.save();

    res.json({ bill: toJson(bill), message: 'Bill cancelled' });
  } catch (error) {
    console.error('cancelBill error:', error);
    res.status(500).json({ message: 'Failed to cancel bill', error: error.message });
  }
}

module.exports = {
  getStats,
  getNextBillNumber,
  createBill,
  addItemToBill,
  applyDiscount,
  generateKOT,
  settleBill,
  processRefund,
  getBill,
  listBills,
  cancelBill,
};
