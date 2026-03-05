async function applyCreditToBooking({ GuestLedgerEntry, guestId, bookingId, amount, creditNoteId }) {
  if (!GuestLedgerEntry) return null;
  const entry = await GuestLedgerEntry.create({
    guestId: String(guestId),
    bookingId: bookingId ? String(bookingId) : null,
    type: 'ADJUSTMENT',
    description: 'Credit note applied to bill',
    amount: Math.abs(Number(amount || 0)),
    isDebit: false, // reduces outstanding
    referenceId: creditNoteId || null,
  });
  return entry.toJSON();
}

module.exports = { applyCreditToBooking };

