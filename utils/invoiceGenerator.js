const { consolidateTax } = require('./taxConsolidator');

/**
 * Build a unified invoice JSON payload for combined bills.
 * This does not persist anything – the caller is responsible for saving Invoice rows if needed.
 */
function generateCombinedInvoice({
  hotelProfile,
  booking,
  folio,
  breakdowns = [],
  payments = [],
  invoiceNumber,
}) {
  const tax = consolidateTax(breakdowns);

  const subtotal =
    (folio?.ledger?.roomChargesTotal || 0) +
    (folio?.ledger?.restaurantChargesTotal || 0) +
    (folio?.ledger?.otherChargesTotal || 0);

  const grandTotal = tax.grossTotal || subtotal;
  const paidTotal = payments.reduce(
    (s, p) => s + Number(p.amount || 0),
    0,
  );
  const balance = grandTotal - paidTotal;

  return {
    invoiceNumber: invoiceNumber || null,
    hotel: hotelProfile || null,
    guest: {
      id: booking?.guestId,
      name: booking?.guestName,
      roomNumber: booking?.roomNumber,
      checkIn: booking?.checkIn,
      checkOut: booking?.checkOut,
      nights: booking?.nights,
    },
    folio: folio || null,
    charges: {
      room: folio?.ledger?.roomChargesTotal || 0,
      restaurant: folio?.ledger?.restaurantChargesTotal || 0,
      other: folio?.ledger?.otherChargesTotal || 0,
      subtotal,
    },
    tax,
    payments,
    totals: {
      grandTotal,
      paidTotal,
      balance,
    },
  };
}

module.exports = { generateCombinedInvoice };

