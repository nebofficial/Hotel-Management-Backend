const { getNextAdvanceReceiptNumber } = require('../utils/receiptNumberGenerator');
const { calculateAdvanceBalances } = require('../utils/balanceCalculator');
const { needsManagerApproval } = require('../utils/approvalWorkflow');
const {
  postAdvanceEntry,
  postAdvanceAdjustmentEntry,
  postAdvanceRefundEntry,
} = require('../utils/accountingEntryService');

function normalizeMethod(mode) {
  const v = (mode || '').toLowerCase();
  if (v === 'cash') return 'cash';
  if (v === 'card' || v === 'credit_card' || v === 'debit_card') return 'credit_card';
  if (v === 'upi') return 'bank_transfer';
  if (v === 'bank' || v === 'bank_transfer') return 'bank_transfer';
  return 'other';
}

function toJson(model) {
  if (!model) return null;
  const d = model.get ? model.get({ plain: true }) : model;
  return JSON.parse(JSON.stringify(d));
}

exports.collectAdvance = async (req, res) => {
  try {
    const { bookingId, amount, mode, notes } = req.body || {};
    if (!bookingId) return res.status(400).json({ message: 'bookingId is required' });

    const { Booking, Payment, AdvancePayment, GuestLedgerEntry } = req.hotelModels;
    await AdvancePayment.sync({ alter: false });
    await Payment.sync({ alter: false });
    await GuestLedgerEntry.sync({ alter: true });

    const booking = await Booking.findByPk(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const amt = Number(amount || 0) || 0;
    if (amt <= 0) return res.status(400).json({ message: 'Amount must be > 0' });

    const receiptNumber = await getNextAdvanceReceiptNumber(AdvancePayment);

    const method = normalizeMethod(mode);
    const payment = await Payment.create({
      bookingId: String(booking.id),
      amount: amt,
      currency: booking.currency || 'INR',
      paymentMethod: method,
      status: 'completed',
      transactionId: receiptNumber,
      guestId: String(booking.guestId),
      guestName: String(booking.guestName),
      notes: notes || (mode ? `Mode: ${mode}` : null),
    });

    const advance = await AdvancePayment.create({
      receiptNumber,
      bookingId: String(booking.id),
      guestId: String(booking.guestId),
      guestName: String(booking.guestName),
      amount: amt,
      method,
      notes: notes || null,
    });

    await postAdvanceEntry({
      GuestLedgerEntry,
      guestId: booking.guestId,
      bookingId: booking.id,
      amount: amt,
      referenceId: advance.id,
    });

    const newAdvance = Number(booking.advancePaid || 0) + amt;
    const total = Number(booking.totalAmount || 0);
    const balanceAmount = Math.max(0, total - newAdvance);
    await booking.update({
      advancePaid: newAdvance,
      balanceAmount,
      paymentMode: mode || booking.paymentMode || null,
    });

    res.status(201).json({
      advance: toJson(advance),
      payment: toJson(payment),
      booking: toJson(booking),
    });
  } catch (error) {
    console.error('collectAdvance error:', error);
    res.status(500).json({ message: 'Failed to collect advance', error: error.message });
  }
};

exports.linkAdvanceToBooking = async (req, res) => {
  try {
    const { receiptNumber, bookingId } = req.body || {};
    if (!receiptNumber || !bookingId) {
      return res.status(400).json({ message: 'receiptNumber and bookingId are required' });
    }
    const { Booking, AdvancePayment } = req.hotelModels;
    await AdvancePayment.sync({ alter: false });

    const booking = await Booking.findByPk(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const advance = await AdvancePayment.findOne({ where: { receiptNumber } });
    if (!advance) return res.status(404).json({ message: 'Advance not found' });

    if (advance.bookingId && advance.bookingId !== String(booking.id)) {
      return res.status(400).json({ message: 'Advance already linked to another booking' });
    }

    await advance.update({ bookingId: String(booking.id) });

    res.json({ advance: toJson(advance), booking: toJson(booking) });
  } catch (error) {
    console.error('linkAdvanceToBooking error:', error);
    res.status(500).json({ message: 'Failed to link advance', error: error.message });
  }
};

exports.adjustAdvance = async (req, res) => {
  try {
    const { receiptNumber, bookingId, amount } = req.body || {};
    if (!receiptNumber || !bookingId) {
      return res.status(400).json({ message: 'receiptNumber and bookingId are required' });
    }
    const { AdvancePayment, GuestLedgerEntry, Booking } = req.hotelModels;
    await AdvancePayment.sync({ alter: false });
    await GuestLedgerEntry.sync({ alter: true });

    const advance = await AdvancePayment.findOne({ where: { receiptNumber } });
    if (!advance) return res.status(404).json({ message: 'Advance not found' });

    const amt = Number(amount || 0) || 0;
    if (amt <= 0) return res.status(400).json({ message: 'Amount must be > 0' });

    const remaining =
      Number(advance.amount || 0) -
      Number(advance.adjustedAmount || 0) -
      Number(advance.refundedAmount || 0);
    if (amt > remaining) {
      return res.status(400).json({ message: 'Amount exceeds available advance balance' });
    }

    await postAdvanceAdjustmentEntry({
      GuestLedgerEntry,
      guestId: advance.guestId,
      bookingId,
      amount: amt,
      referenceId: advance.id,
    });

    const updatedAdjusted = Number(advance.adjustedAmount || 0) + amt;
    const updatedStatus =
      updatedAdjusted >= Number(advance.amount || 0) ? 'FULLY_ADJUSTED' : 'PARTIALLY_USED';

    await advance.update({
      adjustedAmount: updatedAdjusted,
      status: updatedStatus,
    });

    const booking = await Booking.findByPk(bookingId);
    res.json({ advance: toJson(advance), booking: booking ? toJson(booking) : null });
  } catch (error) {
    console.error('adjustAdvance error:', error);
    res.status(500).json({ message: 'Failed to adjust advance', error: error.message });
  }
};

exports.refundAdvance = async (req, res) => {
  try {
    const { receiptNumber, bookingId, amount, mode, reason, managerApproved } = req.body || {};
    if (!receiptNumber) return res.status(400).json({ message: 'receiptNumber is required' });

    const { AdvancePayment, GuestLedgerEntry, Payment } = req.hotelModels;
    await AdvancePayment.sync({ alter: false });
    await GuestLedgerEntry.sync({ alter: true });
    await Payment.sync({ alter: false });

    const advance = await AdvancePayment.findOne({ where: { receiptNumber } });
    if (!advance) return res.status(404).json({ message: 'Advance not found' });

    const amt = Number(amount || 0) || 0;
    if (amt <= 0) return res.status(400).json({ message: 'Amount must be > 0' });

    const remaining =
      Number(advance.amount || 0) -
      Number(advance.adjustedAmount || 0) -
      Number(advance.refundedAmount || 0);
    if (amt > remaining) {
      return res.status(400).json({ message: 'Amount exceeds available advance balance' });
    }

    const approval = needsManagerApproval({ amount: amt });
    if (approval.required && !managerApproved) {
      return res.status(403).json({
        message: approval.reason,
        requiresApproval: true,
      });
    }

    await postAdvanceRefundEntry({
      GuestLedgerEntry,
      guestId: advance.guestId,
      bookingId: bookingId || advance.bookingId,
      amount: amt,
      referenceId: advance.id,
      reason,
    });

    const payment = await Payment.create({
      bookingId: bookingId || advance.bookingId || null,
      amount: amt,
      currency: 'INR',
      paymentMethod: normalizeMethod(mode),
      status: 'refunded',
      transactionId: `${advance.receiptNumber}-REF`,
      guestId: String(advance.guestId),
      guestName: String(advance.guestName),
      notes: reason || 'Advance refund',
    });

    const updatedRefunded = Number(advance.refundedAmount || 0) + amt;
    const updatedStatus =
      updatedRefunded >= Number(advance.amount || 0)
        ? 'REFUNDED'
        : Number(advance.adjustedAmount || 0) > 0
        ? 'PARTIALLY_USED'
        : 'COLLECTED';

    await advance.update({
      refundedAmount: updatedRefunded,
      status: updatedStatus,
    });

    res.json({ advance: toJson(advance), payment: toJson(payment) });
  } catch (error) {
    console.error('refundAdvance error:', error);
    res.status(500).json({ message: 'Failed to refund advance', error: error.message });
  }
};

exports.getAdvanceHistory = async (req, res) => {
  try {
    const { guestId, bookingId } = req.query || {};
    const { AdvancePayment } = req.hotelModels;
    await AdvancePayment.sync({ alter: false });

    const where = {};
    if (guestId) where.guestId = String(guestId);
    if (bookingId) where.bookingId = String(bookingId);

    const list = await AdvancePayment.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
    const balances = calculateAdvanceBalances(list);
    res.json({ list: list.map(toJson), summary: balances });
  } catch (error) {
    console.error('getAdvanceHistory error:', error);
    res.status(500).json({ message: 'Failed to load advance history', error: error.message });
  }
};

