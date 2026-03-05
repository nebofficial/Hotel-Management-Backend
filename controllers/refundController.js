const { validateRefund } = require('../utils/refundValidator');
const { needsRefundApproval } = require('../utils/approvalEngine');
const { postRefundLedgerEntry } = require('../utils/accountingAdjustmentService');
const { generateRefundReceipt } = require('../utils/receiptGenerator');

function toJson(model) {
  return model && typeof model.toJSON === 'function' ? model.toJSON() : model;
}

exports.fetchBillDetails = async (req, res) => {
  try {
    const { query } = req;
    const { RoomBill, RestaurantBill, Refund } = req.hotelModels;

    const bills = [];

    if (RoomBill) {
      const where = {};
      if (query.billNumber) where.billNumber = String(query.billNumber);
      const roomBills = await RoomBill.findAll({ where, order: [['createdAt', 'DESC']], limit: 20 });
      for (const b of roomBills) {
        const prevRefunds = await Refund.findAll({ where: { bookingId: String(b.bookingId) } });
        const refundedAmount = prevRefunds.reduce((s, r) => s + Number(r.amount || 0), 0);
        bills.push({
          id: `room-${b.id}`,
          type: 'ROOM',
          billNumber: b.billNumber,
          bookingId: b.bookingId,
          guestName: b.guestName,
          createdAt: b.createdAt,
          totalAmount: Number(b.grandTotal || 0),
          paidAmount: Number(b.netPayable || b.grandTotal || 0),
          refundedAmount,
        });
      }
    }

    if (RestaurantBill) {
      const where = {};
      if (query.billNumber) where.billNumber = String(query.billNumber);
      const restBills = await RestaurantBill.findAll({ where, order: [['createdAt', 'DESC']], limit: 20 });
      for (const b of restBills) {
        bills.push({
          id: `rest-${b.id}`,
          type: 'RESTAURANT',
          billNumber: b.billNumber,
          bookingId: null,
          guestName: b.guestName,
          createdAt: b.createdAt,
          totalAmount: Number(b.totalAmount || 0),
          paidAmount: Number(b.totalAmount || 0),
          refundedAmount: 0,
        });
      }
    }

    res.json({ bills });
  } catch (error) {
    console.error('fetchBillDetails error:', error);
    res.status(500).json({ message: 'Failed to fetch bills', error: error.message });
  }
};

exports.initiateRefund = async (req, res) => {
  try {
    const { billId, bookingId, amount, fullCancellation } = req.body || {};
    if (!billId && !bookingId) return res.status(400).json({ message: 'billId or bookingId is required' });

    const { Booking, Refund } = req.hotelModels;

    const booking = await Booking.findByPk(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const existingRefunds = await Refund.findAll({ where: { bookingId: String(booking.id) } });
    const refundedAmount = existingRefunds.reduce((s, r) => s + Number(r.amount || 0), 0);
    const totalPaid = Number(booking.advancePaid || 0);

    const v = validateRefund({
      totalPaid,
      alreadyRefunded: refundedAmount,
      requestedAmount: amount,
    });
    if (!v.ok) {
      return res.status(400).json({ message: v.message });
    }

    const approval = needsRefundApproval({ amount, fullCancellation: !!fullCancellation });

    const refund = await Refund.create({
      bookingId: String(booking.id),
      paymentId: null,
      amount: Number(amount || 0),
      method: 'pending',
      reference: billId || null,
      status: approval.required ? 'PENDING' : 'COMPLETED',
      notes: fullCancellation ? 'Full bill refund' : 'Partial refund',
    });

    res.status(201).json({
      refund: toJson(refund),
      requiresApproval: approval.required,
      approvalReason: approval.reason,
    });
  } catch (error) {
    console.error('initiateRefund error:', error);
    res.status(500).json({ message: 'Failed to initiate refund', error: error.message });
  }
};

exports.approveRefund = async (req, res) => {
  try {
    const { refundId } = req.body || {};
    if (!refundId) return res.status(400).json({ message: 'refundId is required' });
    const { Refund } = req.hotelModels;
    const refund = await Refund.findByPk(refundId);
    if (!refund) return res.status(404).json({ message: 'Refund not found' });

    await refund.update({ status: 'COMPLETED', method: refund.method === 'pending' ? 'approved' : refund.method });

    res.json({ refund: toJson(refund) });
  } catch (error) {
    console.error('approveRefund error:', error);
    res.status(500).json({ message: 'Failed to approve refund', error: error.message });
  }
};

exports.processRefund = async (req, res) => {
  try {
    const { refundId, method, reason } = req.body || {};
    if (!refundId) return res.status(400).json({ message: 'refundId is required' });

    const { Refund, Booking, GuestLedgerEntry } = req.hotelModels;
    const refund = await Refund.findByPk(refundId);
    if (!refund) return res.status(404).json({ message: 'Refund not found' });

    const booking = await Booking.findByPk(refund.bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    await refund.update({
      method: method || refund.method,
      notes: reason || refund.notes,
    });

    await postRefundLedgerEntry({
      GuestLedgerEntry,
      guestId: booking.guestId,
      bookingId: booking.id,
      amount: refund.amount,
      reason: reason || refund.notes,
    });

    res.json({ refund: toJson(refund) });
  } catch (error) {
    console.error('processRefund error:', error);
    res.status(500).json({ message: 'Failed to process refund', error: error.message });
  }
};

exports.generateRefundReceipt = async (req, res) => {
  try {
    const { refundId } = req.body || {};
    if (!refundId) return res.status(400).json({ message: 'refundId is required' });
    const { Refund, Booking, HotelProfile } = req.hotelModels;
    const refund = await Refund.findByPk(refundId);
    if (!refund) return res.status(404).json({ message: 'Refund not found' });

    const booking = await Booking.findByPk(refund.bookingId);
    let profile = null;
    if (HotelProfile) {
      try {
        await HotelProfile.sync({ alter: false });
        profile = await HotelProfile.findOne({ where: { hotelId: booking.hotelId } });
      } catch (e) {
        console.warn('Refund receipt hotel profile error:', e.message);
      }
    }

    const receipt = generateRefundReceipt({
      hotelProfile: profile ? toJson(profile) : null,
      booking: booking ? toJson(booking) : null,
      refund: toJson(refund),
    });

    res.json({ receipt });
  } catch (error) {
    console.error('generateRefundReceipt error:', error);
    res.status(500).json({ message: 'Failed to generate refund receipt', error: error.message });
  }
};

