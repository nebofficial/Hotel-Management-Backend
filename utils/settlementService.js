const { Op } = require('sequelize');

function safeNumber(v) {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

/**
 * Generic settlement helper used by combined bills.
 * Creates Payment rows and returns updated balance information.
 */
async function settleGuestFolio({ Booking, Payment, GuestLedgerEntry, bookingId, guestId, guestName, payments }) {
  if (!Array.isArray(payments) || payments.length === 0) {
    const err = new Error('At least one payment is required');
    err.status = 400;
    throw err;
  }

  await Payment.sync({ alter: false });
  await GuestLedgerEntry.sync({ alter: true });

  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404;
    throw err;
  }

  const entries = await GuestLedgerEntry.findAll({
    where: { bookingId: String(bookingId) },
    order: [['createdAt', 'ASC']],
  });
  const priorPayments = await Payment.findAll({
    where: { bookingId: String(bookingId), status: 'completed' },
  });

  const charges = entries
    .filter((e) => e.isDebit)
    .reduce((s, e) => s + safeNumber(e.amount), 0) || safeNumber(booking.totalAmount);
  const credits =
    entries
      .filter((e) => !e.isDebit)
      .reduce((s, e) => s + safeNumber(e.amount), 0) +
    priorPayments.reduce((s, p) => s + safeNumber(p.amount), 0);

  const currentBalance = charges - credits;

  const newPaymentsTotal = payments.reduce(
    (s, p) => s + safeNumber(p.amount),
    0,
  );

  if (newPaymentsTotal <= 0) {
    const err = new Error('Payment amount must be positive');
    err.status = 400;
    throw err;
  }

  // Allow small rounding tolerance
  if (Math.abs(newPaymentsTotal - currentBalance) > 0.5) {
    const err = new Error(
      `Payment split must equal outstanding balance (${currentBalance.toFixed(
        2,
      )})`,
    );
    err.status = 400;
    throw err;
  }

  const created = [];
  const normalizeMethod = (m) => {
    const val = (m || '').toLowerCase();
    if (val === 'card' || val === 'credit' || val === 'debit') return 'credit_card';
    if (val === 'upi' || val === 'bank' || val === 'bank_transfer') return 'bank_transfer';
    if (val === 'cash') return 'cash';
    return 'other';
  };
  for (const p of payments) {
    const pay = await Payment.create({
      bookingId: String(bookingId),
      guestId: String(guestId),
      guestName,
      amount: safeNumber(p.amount),
      currency: booking.currency || 'INR',
      paymentMethod: normalizeMethod(p.method),
      status: 'completed',
      transactionId: p.transactionId || null,
      notes: p.notes || 'Combined bill settlement',
    });
    created.push(pay.toJSON());
  }

  const newCredits =
    credits + created.reduce((s, p) => s + safeNumber(p.amount), 0);
  const newBalance = charges - newCredits;

  return {
    booking: booking.toJSON(),
    payments: created,
    charges,
    credits: newCredits,
    balance: newBalance,
  };
}

module.exports = { settleGuestFolio };

