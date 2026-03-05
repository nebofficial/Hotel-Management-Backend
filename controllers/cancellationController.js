const { calculateCancellationPolicy } = require('../utils/cancellationPolicyEngine');
const { createRefund } = require('../utils/refundService');

function toJson(model) {
  return model && typeof model.toJSON === 'function' ? model.toJSON() : model;
}

async function calculateCancellationFee(req, res) {
  try {
    const { bookingId, asOf } = req.body || {};
    if (!bookingId) return res.status(400).json({ message: 'bookingId is required' });

    const { Booking } = req.hotelModels;
    const booking = await Booking.findByPk(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const nights = 1;
    const nightlyRate = Number(booking.roomCostTotal || booking.totalAmount || 0) || 0;
    const advancePaid = Number(booking.advancePaid || 0);

    const policy = calculateCancellationPolicy({
      booking,
      asOf,
      nightlyRate,
      advancePaid,
    });

    res.json(policy);
  } catch (error) {
    console.error('calculateCancellationFee error:', error);
    res.status(500).json({ message: 'Failed to calculate cancellation fee', error: error.message });
  }
}

async function cancelReservation(req, res) {
  try {
    const { bookingId, reason, asOf, refundMethod, refundReference } = req.body || {};
    if (!bookingId) return res.status(400).json({ message: 'bookingId is required' });

    const { Booking, Refund } = req.hotelModels;

    const booking = await Booking.findByPk(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const nightlyRate = Number(booking.roomCostTotal || booking.totalAmount || 0) || 0;
    const advancePaid = Number(booking.advancePaid || 0);

    const policy = calculateCancellationPolicy({
      booking,
      asOf,
      nightlyRate,
      advancePaid,
    });

    await booking.update({
      status: 'cancelled',
      cancelReason: reason || null,
      cancelledAt: new Date(),
      isNoShow: false,
    });

    let refund = null;
    if (policy.refundableAmount > 0) {
      refund = await createRefund({
        Refund,
        Booking,
        bookingId,
        amount: policy.refundableAmount,
        method: refundMethod || 'original',
        reference: refundReference || null,
        notes: 'Auto refund on cancellation',
      });
    }

    res.json({
      booking: toJson(booking),
      policy,
      refund: refund ? toJson(refund) : null,
    });
  } catch (error) {
    console.error('cancelReservation error:', error);
    res.status(500).json({ message: 'Failed to cancel reservation', error: error.message });
  }
}

async function processRefund(req, res) {
  try {
    const { bookingId, amount, method, reference } = req.body || {};
    if (!bookingId) return res.status(400).json({ message: 'bookingId is required' });

    const { Refund, Booking } = req.hotelModels;
    const refund = await createRefund({
      Refund,
      Booking,
      bookingId,
      amount,
      method,
      reference,
      notes: 'Manual refund via cancellation module',
    });

    res.json({ refund: toJson(refund) });
  } catch (error) {
    console.error('processRefund error:', error);
    res.status(500).json({ message: 'Failed to process refund', error: error.message });
  }
}

async function markNoShow(req, res) {
  try {
    const { bookingId, reason } = req.body || {};
    if (!bookingId) return res.status(400).json({ message: 'bookingId is required' });

    const { Booking } = req.hotelModels;
    const booking = await Booking.findByPk(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    await booking.update({
      status: 'cancelled',
      cancelReason: reason || 'No-show',
      cancelledAt: new Date(),
      isNoShow: true,
    });

    res.json({ booking: toJson(booking) });
  } catch (error) {
    console.error('markNoShow error:', error);
    res.status(500).json({ message: 'Failed to mark no-show', error: error.message });
  }
}

module.exports = {
  calculateCancellationFee,
  cancelReservation,
  processRefund,
  markNoShow,
};

