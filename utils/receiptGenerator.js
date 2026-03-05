/**
 * Build a simple refund receipt payload from booking, refund, and hotel profile.
 */
function generateRefundReceipt({ hotelProfile, booking, refund }) {
  const guest = booking
    ? {
        name: booking.guestName,
        roomNumber: booking.roomNumber,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
      }
    : null;

  return {
    receiptNumber: refund.id,
    refundAmount: Number(refund.amount || 0),
    method: refund.method,
    reference: refund.reference,
    notes: refund.notes || null,
    createdAt: refund.createdAt,
    hotel: hotelProfile || null,
    guest,
    bookingId: booking ? booking.id : refund.bookingId,
  };
}

module.exports = { generateRefundReceipt };

