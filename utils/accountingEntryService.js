/**
 * Helper functions to create GuestLedgerEntry rows for advances and refunds.
 */

function safeNumber(v) {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

async function postAdvanceEntry({ GuestLedgerEntry, guestId, bookingId, amount, referenceId }) {
  if (!GuestLedgerEntry) return null;
  const entry = await GuestLedgerEntry.create({
    guestId: String(guestId),
    bookingId: bookingId ? String(bookingId) : null,
    type: 'ADVANCE',
    description: 'Advance payment collected',
    amount: Math.abs(safeNumber(amount)),
    isDebit: false, // credit
    referenceId: referenceId || null,
  });
  return entry.toJSON();
}

async function postAdvanceAdjustmentEntry({ GuestLedgerEntry, guestId, bookingId, amount, referenceId }) {
  if (!GuestLedgerEntry) return null;
  const entry = await GuestLedgerEntry.create({
    guestId: String(guestId),
    bookingId: bookingId ? String(bookingId) : null,
    type: 'ADJUSTMENT',
    description: 'Advance adjusted against bill',
    amount: Math.abs(safeNumber(amount)),
    isDebit: false, // credit reducing outstanding
    referenceId: referenceId || null,
  });
  return entry.toJSON();
}

async function postAdvanceRefundEntry({ GuestLedgerEntry, guestId, bookingId, amount, referenceId, reason }) {
  if (!GuestLedgerEntry) return null;
  const entry = await GuestLedgerEntry.create({
    guestId: String(guestId),
    bookingId: bookingId ? String(bookingId) : null,
    type: 'REFUND',
    description: reason || 'Advance refund',
    amount: Math.abs(safeNumber(amount)),
    isDebit: false, // treated as credit in existing ledger logic
    referenceId: referenceId || null,
  });
  return entry.toJSON();
}

module.exports = {
  postAdvanceEntry,
  postAdvanceAdjustmentEntry,
  postAdvanceRefundEntry,
};

