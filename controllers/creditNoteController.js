const { getNextCreditNoteNumber } = require('../utils/creditNoteNumberGenerator');
const { applyCreditToBooking } = require('../utils/creditAdjustmentService');
const { trackCreditExpiry } = require('../utils/expiryTracker');
const { generateCreditNotePayload } = require('../utils/pdfGenerator');

function toJson(model) {
  return model && typeof model.toJSON === 'function' ? model.toJSON() : model;
}

exports.fetchInvoiceDetails = async (req, res) => {
  try {
    const { invoiceNumber } = req.query || {};
    const { Invoice, CreditNote } = req.hotelModels;
    const where = {};
    if (invoiceNumber) where.invoiceNumber = String(invoiceNumber);

    const invoices = await Invoice.findAll({ where, order: [['issueDate', 'DESC']], limit: 20 });

    const mapped = [];
    for (const inv of invoices) {
      const credits = await CreditNote.findAll({ where: { invoiceId: String(inv.id) } });
      const credited = credits.reduce((s, c) => s + Number(c.totalAmount || 0), 0);
      mapped.push({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        guestName: inv.guestName,
        issueDate: inv.issueDate,
        totalAmount: Number(inv.totalAmount || 0),
        creditedAmount: credited,
      });
    }
    res.json({ invoices: mapped });
  } catch (error) {
    console.error('fetchInvoiceDetails error:', error);
    res.status(500).json({ message: 'Failed to fetch invoices', error: error.message });
  }
};

exports.createCreditNote = async (req, res) => {
  try {
    const { invoiceId, amount, reason, expiryDate, notes } = req.body || {};
    if (!invoiceId) return res.status(400).json({ message: 'invoiceId is required' });
    const { Invoice, CreditNote } = req.hotelModels;
    await CreditNote.sync({ alter: false });

    const invoice = await Invoice.findByPk(invoiceId);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    const amt = Number(amount || 0) || 0;
    if (amt <= 0) return res.status(400).json({ message: 'Credit amount must be > 0' });

    const existing = await CreditNote.findAll({ where: { invoiceId: String(invoice.id) } });
    const alreadyCredited = existing.reduce((s, c) => s + Number(c.totalAmount || 0), 0);
    const maxCredit = Number(invoice.totalAmount || 0) - alreadyCredited;
    if (amt > maxCredit) {
      return res
        .status(400)
        .json({ message: `Credit cannot exceed remaining invoice amount (₹${maxCredit.toFixed(2)})` });
    }

    const creditNoteNumber = await getNextCreditNoteNumber(CreditNote);
    const cn = await CreditNote.create({
      creditNoteNumber,
      invoiceId: String(invoice.id),
      bookingId: invoice.bookingId || null,
      guestId: invoice.guestId || null,
      guestName: invoice.guestName,
      totalAmount: amt,
      usedAmount: 0,
      reason: reason || null,
      expiryDate: expiryDate || null,
      notes: notes || null,
    });

    res.status(201).json({ creditNote: toJson(cn) });
  } catch (error) {
    console.error('createCreditNote error:', error);
    res.status(500).json({ message: 'Failed to create credit note', error: error.message });
  }
};

exports.applyCredit = async (req, res) => {
  try {
    const { creditNoteId, bookingId, amount } = req.body || {};
    if (!creditNoteId || !bookingId) {
      return res.status(400).json({ message: 'creditNoteId and bookingId are required' });
    }
    const { CreditNote, Booking, GuestLedgerEntry } = req.hotelModels;
    await CreditNote.sync({ alter: false });
    await GuestLedgerEntry.sync({ alter: true });

    const cn = await CreditNote.findByPk(creditNoteId);
    if (!cn) return res.status(404).json({ message: 'Credit note not found' });

    const amt = Number(amount || 0) || 0;
    if (amt <= 0) return res.status(400).json({ message: 'Amount must be > 0' });

    const remaining = Number(cn.totalAmount || 0) - Number(cn.usedAmount || 0);
    if (amt > remaining) {
      return res.status(400).json({ message: 'Amount exceeds remaining credit' });
    }

    const booking = await Booking.findByPk(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    await applyCreditToBooking({
      GuestLedgerEntry,
      guestId: booking.guestId,
      bookingId: booking.id,
      amount: amt,
      creditNoteId: cn.id,
    });

    const newUsed = Number(cn.usedAmount || 0) + amt;
    const newStatus =
      newUsed >= Number(cn.totalAmount || 0) ? 'PARTIALLY_USED' : 'ACTIVE';

    await cn.update({ usedAmount: newUsed, status: newStatus });

    res.json({ creditNote: toJson(cn), booking: toJson(booking) });
  } catch (error) {
    console.error('applyCredit error:', error);
    res.status(500).json({ message: 'Failed to apply credit', error: error.message });
  }
};

exports.fetchOutstandingCredits = async (req, res) => {
  try {
    const { guestId } = req.query || {};
    const { CreditNote } = req.hotelModels;
    await CreditNote.sync({ alter: false });

    const where = {};
    if (guestId) where.guestId = String(guestId);
    const list = await CreditNote.findAll({ where, order: [['createdAt', 'DESC']] });

    const items = list.map(toJson);
    const summary = {
      totalIssued: items.reduce((s, c) => s + Number(c.totalAmount || 0), 0),
      totalUsed: items.reduce((s, c) => s + Number(c.usedAmount || 0), 0),
      balance: items.reduce(
        (s, c) => s + (Number(c.totalAmount || 0) - Number(c.usedAmount || 0)),
        0,
      ),
    };

    res.json({ list: items, summary });
  } catch (error) {
    console.error('fetchOutstandingCredits error:', error);
    res.status(500).json({ message: 'Failed to fetch credits', error: error.message });
  }
};

exports.trackCreditExpiry = async (req, res) => {
  try {
    const { CreditNote } = req.hotelModels;
    await CreditNote.sync({ alter: false });
    const notes = await CreditNote.findAll();
    const tracked = trackCreditExpiry(notes.map(toJson), {});
    res.json(tracked);
  } catch (error) {
    console.error('trackCreditExpiry error:', error);
    res.status(500).json({ message: 'Failed to track credit expiry', error: error.message });
  }
};

exports.generateCreditNotePDF = async (req, res) => {
  try {
    const { creditNoteId } = req.body || {};
    if (!creditNoteId) return res.status(400).json({ message: 'creditNoteId is required' });
    const { CreditNote, Invoice, HotelProfile } = req.hotelModels;
    const cn = await CreditNote.findByPk(creditNoteId);
    if (!cn) return res.status(404).json({ message: 'Credit note not found' });

    const invoice = await Invoice.findByPk(cn.invoiceId);
    let profile = null;
    if (HotelProfile) {
      try {
        await HotelProfile.sync({ alter: false });
        profile = await HotelProfile.findOne({ where: { hotelId: invoice.hotelId } });
      } catch (e) {
        console.warn('generateCreditNotePDF profile error:', e.message);
      }
    }

    const payload = generateCreditNotePayload({
      hotelProfile: profile ? toJson(profile) : null,
      invoice: invoice ? toJson(invoice) : null,
      creditNote: toJson(cn),
    });

    res.json({ creditNote: payload });
  } catch (error) {
    console.error('generateCreditNotePDF error:', error);
    res.status(500).json({ message: 'Failed to generate credit note PDF', error: error.message });
  }
};

