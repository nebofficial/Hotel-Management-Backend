const { Op } = require('sequelize');
const { calculateRoomBill } = require('../utils/roomBillCalculationService');

async function generateNextBillNumber(RoomBill, yearInput) {
  const now = new Date();
  const year = yearInput || now.getFullYear().toString();
  const prefix = `RB-${year}-`;
  const last = await RoomBill.findOne({
    where: { billNumber: { [Op.like]: `${prefix}%` } },
    order: [['billNumber', 'DESC']],
  });
  const lastNum = last ? parseInt(String(last.billNumber).replace(prefix, ''), 10) : 0;
  const next = String((isNaN(lastNum) ? 0 : lastNum) + 1).padStart(4, '0');
  return `${prefix}${next}`;
}

function toJson(model) {
  return model && typeof model.toJSON === 'function' ? model.toJSON() : model;
}

exports.listRoomBills = async (req, res) => {
  try {
    const { RoomBill } = req.hotelModels;
    await RoomBill.sync();

    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.startDate || req.query.endDate) {
      where.createdAt = {};
      if (req.query.startDate) where.createdAt[Op.gte] = new Date(req.query.startDate);
      if (req.query.endDate) where.createdAt[Op.lte] = new Date(req.query.endDate);
    }
    if (req.query.search) {
      const term = `%${req.query.search}%`;
      where[Op.or] = [
        { billNumber: { [Op.iLike]: term } },
        { roomNumber: { [Op.iLike]: term } },
        { guestName: { [Op.iLike]: term } },
      ];
    }

    const list = await RoomBill.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: 100,
    });
    res.json({ list: list.map(toJson) });
  } catch (error) {
    console.error('Room bills list error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getRoomBill = async (req, res) => {
  try {
    const { RoomBill } = req.hotelModels;
    await RoomBill.sync();
    const bill = await RoomBill.findByPk(req.params.id);
    if (!bill) return res.status(404).json({ message: 'Room bill not found' });
    res.json({ bill: toJson(bill) });
  } catch (error) {
    console.error('Room bill get error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getBookingDetails = async (req, res) => {
  try {
    const { Booking, Guest, GuestLedgerEntry, RoomBill } = req.hotelModels;
    await Booking.sync();
    await Guest.sync();
    await GuestLedgerEntry.sync();
    await RoomBill.sync();

    const booking = await Booking.findByPk(req.params.bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const guest = booking.guestId ? await Guest.findByPk(booking.guestId) : null;
    const advances = await GuestLedgerEntry.findAll({
      where: {
        guestId: booking.guestId,
        bookingId: booking.id,
        type: 'ADVANCE',
        isDebit: false,
      },
      attributes: ['amount'],
    });
    const advancePaid = advances.reduce((s, e) => s + Number(e.amount || 0), 0);

    const existing = await RoomBill.findOne({
      where: { bookingId: booking.id, status: { [Op.in]: ['DRAFT', 'PENDING'] } },
      order: [['createdAt', 'DESC']],
    });

    res.json({
      booking: toJson(booking),
      guest: guest ? toJson(guest) : null,
      advancePaid,
      existingBill: existing ? toJson(existing) : null,
    });
  } catch (error) {
    console.error('Room bill booking details error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createOrUpdateDraft = async (req, res) => {
  try {
    const { RoomBill, Booking } = req.hotelModels;
    await RoomBill.sync();
    await Booking.sync();

    const booking = await Booking.findByPk(req.body.bookingId);
    if (!booking) return res.status(400).json({ message: 'Invalid bookingId' });

    const basePayload = {
      bookingId: booking.id,
      guestId: booking.guestId,
      guestName: booking.guestName,
      roomId: booking.roomId,
      roomNumber: booking.roomNumber,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      nights: req.body.nights != null ? req.body.nights : 1,
      pricePerNight: req.body.pricePerNight,
      lateCheckoutCharge: req.body.lateCheckoutCharge,
      extraBedCharge: req.body.extraBedCharge,
      extras: req.body.extras || [],
      discountAmount: req.body.discountAmount,
      discountPercent: req.body.discountPercent,
      applyDiscountBeforeTax: req.body.applyDiscountBeforeTax,
      gstPercent: req.body.gstPercent,
      serviceChargeEnabled: req.body.serviceChargeEnabled,
      serviceChargePercent: req.body.serviceChargePercent,
      advancePaid: req.body.advancePaid,
      hotelState: req.body.hotelState || null,
      placeOfSupplyState: req.body.placeOfSupplyState || null,
      notes: req.body.notes || null,
      currency: req.body.currency || 'INR',
    };

    const calc = calculateRoomBill(basePayload);
    const computed = {
      nights: calc.nights,
      roomSubtotal: calc.roomSubtotal,
      extrasSubtotal: calc.extrasSubtotal,
      subtotal: calc.subtotal,
      discountTotal: calc.discountTotal,
      taxableAmount: calc.taxableAmount,
      cgst: calc.cgst,
      sgst: calc.sgst,
      igst: calc.igst,
      taxTotal: calc.taxTotal,
      serviceChargeAmount: calc.serviceChargeAmount,
      grandTotal: calc.grandTotal,
      advancePaid: calc.advancePaid,
      advanceAdjusted: calc.advanceAdjusted,
      netPayable: calc.netPayable,
    };

    let bill = null;
    if (req.body.id) {
      bill = await RoomBill.findByPk(req.body.id);
    }
    if (!bill) {
      const billNumber = await generateNextBillNumber(RoomBill, req.body.year);
      bill = await RoomBill.create({
        billNumber,
        status: 'DRAFT',
        ...basePayload,
        ...computed,
      });
    } else {
      await bill.update({
        ...basePayload,
        ...computed,
      });
    }

    res.status(201).json({ bill: toJson(bill) });
  } catch (error) {
    console.error('Room bill draft error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.settleRoomBill = async (req, res) => {
  try {
    const { RoomBill, Payment, Booking } = req.hotelModels;
    await RoomBill.sync();
    await Payment.sync();
    await Booking.sync();

    const { bookingId, guestId, guestName, payments } = req.body || {};
    if (!bookingId || !guestId || !guestName || !Array.isArray(payments) || payments.length === 0) {
      return res.status(400).json({ message: 'Invalid settle payload' });
    }

    const booking = await Booking.findByPk(bookingId);
    if (!booking) return res.status(400).json({ message: 'Invalid bookingId' });

    let bill = await RoomBill.findOne({
      where: { bookingId, status: { [Op.in]: ['DRAFT', 'PENDING'] } },
      order: [['createdAt', 'DESC']],
    });

    // If draft doesn't exist, create minimal from provided amounts (fallback)
    if (!bill) {
      const billNumber = await generateNextBillNumber(RoomBill, req.body.year);
      const subtotal = Number(req.body.subtotal || 0);
      const taxTotal = Number(req.body.taxAmount || 0);
      const grandTotal = subtotal + taxTotal;
      bill = await RoomBill.create({
        billNumber,
        bookingId: booking.id,
        guestId,
        guestName,
        roomId: booking.roomId,
        roomNumber: booking.roomNumber,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        nights: 1,
        pricePerNight: 0,
        extras: req.body.items || [],
        subtotal,
        taxableAmount: subtotal,
        taxTotal,
        grandTotal,
        netPayable: grandTotal,
        status: 'PENDING',
      });
    }

    const totalPaid = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
    const netPayable = Number(bill.netPayable || 0);
    if (Math.abs(totalPaid - netPayable) > 0.5) {
      return res.status(400).json({ message: `Payment split must equal net payable (${netPayable})` });
    }

    // Create payment rows
    const createdPayments = [];
    for (const p of payments) {
      const pay = await Payment.create({
        bookingId,
        guestId,
        guestName,
        amount: Number(p.amount || 0),
        currency: bill.currency || 'INR',
        paymentMethod: p.method || 'cash',
        status: 'completed',
        transactionId: p.transactionId || null,
        notes: `Settlement for ${bill.billNumber}`,
      });
      createdPayments.push(toJson(pay));
    }

    await bill.update({
      paymentSplit: payments,
      status: 'SETTLED',
    });

    res.json({ bill: toJson(bill), payments: createdPayments });
  } catch (error) {
    console.error('Room bill settle error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

