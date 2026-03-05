/**
 * Stubs for accounting adjustments on refund.
 * For now, we only create a GuestLedgerEntry entry to reflect the refund.
 */

function safeNumber(v) {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

async function postRefundLedgerEntry({ GuestLedgerEntry, guestId, bookingId, amount, reason }) {
  if (!GuestLedgerEntry) return null;
  const row = await GuestLedgerEntry.create({
    guestId: String(guestId),
    bookingId: bookingId ? String(bookingId) : null,
    type: 'REFUND',
    description: reason || 'Bill refund',
    amount: Math.abs(safeNumber(amount)),
    isDebit: false, // credit to reduce balance
    referenceId: null,
  });
  return row.toJSON();
}

module.exports = {
  postRefundLedgerEntry,
};

