/**
 * Stub PDF generator for credit notes.
 * Returns a JSON structure the frontend can use to render/print.
 */
function generateCreditNotePayload({ hotelProfile, invoice, creditNote }) {
  return {
    creditNoteNumber: creditNote.creditNoteNumber,
    amount: Number(creditNote.totalAmount || 0),
    usedAmount: Number(creditNote.usedAmount || 0),
    guestName: creditNote.guestName,
    invoiceNumber: invoice?.invoiceNumber || null,
    issueDate: creditNote.createdAt,
    expiryDate: creditNote.expiryDate,
    reason: creditNote.reason,
    hotel: hotelProfile || null,
  };
}

module.exports = { generateCreditNotePayload };

