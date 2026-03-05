const { buildGuestFolio } = require('../utils/folioMerger');
const { consolidateTax } = require('../utils/taxConsolidator');
const { settleGuestFolio } = require('../utils/settlementService');
const { generateCombinedInvoice } = require('../utils/invoiceGenerator');

function toJson(model) {
  if (!model) return null;
  const d = model.get ? model.get({ plain: true }) : model;
  return JSON.parse(JSON.stringify(d));
}

exports.fetchGuestFolio = async (req, res) => {
  try {
    const bookingId = req.query.bookingId || req.body.bookingId;
    if (!bookingId) {
      return res.status(400).json({ message: 'bookingId is required' });
    }
    const { Booking, RoomBill, GuestLedgerEntry, RestaurantBill } =
      req.hotelModels;
    const folio = await buildGuestFolio({
      Booking,
      RoomBill,
      GuestLedgerEntry,
      RestaurantBill,
      bookingId,
    });
    res.json({ folio });
  } catch (error) {
    console.error('fetchGuestFolio error:', error);
    res
      .status(error.status || 500)
      .json({ message: error.message || 'Failed to load folio' });
  }
};

exports.addOtherCharges = async (req, res) => {
  try {
    const { bookingId, guestId, items } = req.body || {};
    if (!bookingId || !guestId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Invalid payload' });
    }
    const { GuestLedgerEntry } = req.hotelModels;
    await GuestLedgerEntry.sync({ alter: true });

    const created = [];
    for (const item of items) {
      const entry = await GuestLedgerEntry.create({
        guestId: String(guestId),
        bookingId: String(bookingId),
        type: 'ADJUSTMENT',
        description: item.description || item.label || 'Other charge',
        amount: Math.abs(Number(item.amount || 0)),
        isDebit: true,
      });
      created.push(toJson(entry));
    }

    res.status(201).json({ ok: true, charges: created });
  } catch (error) {
    console.error('addOtherCharges error:', error);
    res
      .status(500)
      .json({ message: 'Failed to add charges', error: error.message });
  }
};

exports.calculateFinalBill = async (req, res) => {
  try {
    const { folio, extraTaxBreakdowns = [] } = req.body || {};
    if (!folio) {
      return res.status(400).json({ message: 'folio is required' });
    }

    const breakdowns = [];
    if (folio.roomBill?.taxBreakdown) breakdowns.push(folio.roomBill.taxBreakdown);
    if (Array.isArray(folio.restaurantBills)) {
      folio.restaurantBills.forEach((b) => {
        if (b.taxBreakdown) breakdowns.push(b.taxBreakdown);
      });
    }
    extraTaxBreakdowns.forEach((b) => breakdowns.push(b));

    const tax = consolidateTax(breakdowns);

    const subtotal =
      (folio.ledger?.roomChargesTotal || 0) +
      (folio.ledger?.restaurantChargesTotal || 0) +
      (folio.ledger?.otherChargesTotal || 0);

    const grandTotal = tax.grossTotal || subtotal;
    const credits =
      (folio.ledger?.advanceTotal || 0) +
      (folio.ledger?.refundTotal || 0);
    const netPayable = grandTotal - credits;

    res.json({
      subtotal,
      tax,
      credits,
      netPayable,
    });
  } catch (error) {
    console.error('calculateFinalBill error:', error);
    res
      .status(500)
      .json({ message: 'Failed to calculate final bill', error: error.message });
  }
};

exports.applyAdvance = async (req, res) => {
  try {
    const { bookingId, guestId, amount, description } = req.body || {};
    if (!bookingId || !guestId || !amount) {
      return res.status(400).json({ message: 'bookingId, guestId and amount are required' });
    }
    const { GuestLedgerEntry } = req.hotelModels;
    await GuestLedgerEntry.sync({ alter: true });

    const entry = await GuestLedgerEntry.create({
      guestId: String(guestId),
      bookingId: String(bookingId),
      type: 'ADVANCE',
      description: description || 'Advance adjustment',
      amount: Math.abs(Number(amount)),
      isDebit: false,
    });

    res.status(201).json({ ok: true, advance: toJson(entry) });
  } catch (error) {
    console.error('applyAdvance error:', error);
    res
      .status(500)
      .json({ message: 'Failed to apply advance', error: error.message });
  }
};

exports.settleCombinedBill = async (req, res) => {
  try {
    const { bookingId, guestId, guestName, payments } = req.body || {};
    if (!bookingId || !guestId || !guestName) {
      return res.status(400).json({ message: 'bookingId, guestId and guestName are required' });
    }
    const { Booking, Payment, GuestLedgerEntry } = req.hotelModels;
    const summary = await settleGuestFolio({
      Booking,
      Payment,
      GuestLedgerEntry,
      bookingId,
      guestId,
      guestName,
      payments: payments || [],
    });

    res.json({ ok: true, settlement: summary });
  } catch (error) {
    console.error('settleCombinedBill error:', error);
    res
      .status(error.status || 500)
      .json({ message: error.message || 'Failed to settle bill' });
  }
};

exports.generateFinalInvoice = async (req, res) => {
  try {
    const { bookingId, folio, taxBreakdowns = [], payments = [], invoiceNumber } =
      req.body || {};
    if (!bookingId || !folio) {
      return res.status(400).json({ message: 'bookingId and folio are required' });
    }

    const { Booking, HotelProfile } = req.hotelModels;
    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    let hotelProfile = null;
    if (HotelProfile) {
      try {
        await HotelProfile.sync({ alter: false });
        hotelProfile = await HotelProfile.findOne({
          where: { hotelId: booking.hotelId },
        });
      } catch (e) {
        console.warn('generateFinalInvoice hotel profile error:', e.message);
      }
    }

    const invoice = generateCombinedInvoice({
      hotelProfile: hotelProfile ? toJson(hotelProfile) : null,
      booking: booking.toJSON(),
      folio,
      breakdowns: taxBreakdowns,
      payments,
      invoiceNumber,
    });

    res.json({ ok: true, invoice });
  } catch (error) {
    console.error('generateFinalInvoice error:', error);
    res
      .status(500)
      .json({ message: 'Failed to generate invoice', error: error.message });
  }
};

