async function createRefund({ Refund, Booking, bookingId, amount, method, reference, notes }) {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) throw new Error('Booking not found for refund');

  const refund = await Refund.create({
    bookingId: String(bookingId),
    paymentId: null,
    amount: Number(amount || 0),
    method: method || 'original',
    reference: reference || null,
    status: 'COMPLETED',
    notes: notes || null,
  });

  return refund;
}

module.exports = {
  createRefund,
};

