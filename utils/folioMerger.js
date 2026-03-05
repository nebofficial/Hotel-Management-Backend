const { Op } = require('sequelize');

function safeNumber(v) {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

/**
 * Build a unified folio snapshot for a booking using RoomBill, GuestLedgerEntry and RestaurantBill.
 *
 * This is intentionally read-only – it does not persist anything, it just prepares
 * a clean JSON payload for the Combined Bills UI.
 */
async function buildGuestFolio({ Booking, RoomBill, GuestLedgerEntry, RestaurantBill, bookingId }) {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404;
    throw err;
  }

  // Latest room bill draft/settled for this booking (if any)
  let roomBill = null;
  if (RoomBill) {
    try {
      await RoomBill.sync({ alter: false });
      roomBill = await RoomBill.findOne({
        where: { bookingId: String(booking.id) },
        order: [['createdAt', 'DESC']],
      });
    } catch (e) {
      // Non-fatal – fallback to totals from booking / ledger
      console.warn('buildGuestFolio RoomBill lookup error:', e.message);
    }
  }

  // Guest ledger entries + derived balances
  let ledgerEntries = [];
  if (GuestLedgerEntry) {
    try {
      await GuestLedgerEntry.sync({ alter: true });
      ledgerEntries = await GuestLedgerEntry.findAll({
        where: { bookingId: String(booking.id) },
        order: [['createdAt', 'ASC']],
      });
    } catch (e) {
      console.warn('buildGuestFolio ledger lookup error:', e.message);
    }
  }

  const toJson = (m) => (m && m.toJSON ? m.toJSON() : m);

  const roomChargeEntries = ledgerEntries.filter((e) =>
    ['ROOM_CHARGE', 'EXTRA_BED', 'LATE_CHECKOUT'].includes(e.type) && e.isDebit,
  );
  const restaurantEntries = ledgerEntries.filter(
    (e) => e.type === 'RESTAURANT' && e.isDebit,
  );
  const otherChargeEntries = ledgerEntries.filter(
    (e) =>
      e.type === 'ADJUSTMENT' &&
      e.isDebit &&
      !['ROOM_CHARGE', 'RESTAURANT'].includes(e.type),
  );
  const advanceEntries = ledgerEntries.filter(
    (e) => e.type === 'ADVANCE' || (!e.isDebit && e.type === 'ADJUSTMENT'),
  );
  const refundEntries = ledgerEntries.filter(
    (e) => e.type === 'REFUND' && !e.isDebit,
  );

  const roomChargesTotal = roomChargeEntries.reduce(
    (s, e) => s + safeNumber(e.amount),
    0,
  );
  const restaurantChargesTotal = restaurantEntries.reduce(
    (s, e) => s + safeNumber(e.amount),
    0,
  );
  const otherChargesTotal = otherChargeEntries.reduce(
    (s, e) => s + safeNumber(e.amount),
    0,
  );
  const advanceTotal = advanceEntries.reduce(
    (s, e) => s + safeNumber(e.amount),
    0,
  );
  const refundTotal = refundEntries.reduce(
    (s, e) => s + safeNumber(e.amount),
    0,
  );

  // Try to resolve linked RestaurantBill rows via referenceId
  let restaurantBills = [];
  if (RestaurantBill && restaurantEntries.length > 0) {
    try {
      await RestaurantBill.sync({ alter: false });
      const billIds = restaurantEntries
        .map((e) => e.referenceId)
        .filter(Boolean);
      if (billIds.length > 0) {
        restaurantBills = await RestaurantBill.findAll({
          where: { id: { [Op.in]: billIds } },
          order: [['createdAt', 'DESC']],
        });
      }
    } catch (e) {
      console.warn('buildGuestFolio RestaurantBill lookup error:', e.message);
    }
  }

  const baseRoomTotal =
    roomBill && safeNumber(roomBill.grandTotal) > 0
      ? safeNumber(roomBill.grandTotal)
      : roomChargesTotal || safeNumber(booking.totalAmount);

  const subtotal =
    baseRoomTotal + restaurantChargesTotal + otherChargesTotal;
  const credits = advanceTotal + refundTotal;
  const balance = subtotal - credits;

  return {
    booking: toJson(booking),
    roomBill: roomBill ? toJson(roomBill) : null,
    ledger: {
      entries: ledgerEntries.map(toJson),
      roomChargesTotal: baseRoomTotal,
      restaurantChargesTotal,
      otherChargesTotal,
      advanceTotal,
      refundTotal,
      subtotal,
      credits,
      balance,
    },
    restaurantBills: restaurantBills.map(toJson),
  };
}

module.exports = { buildGuestFolio };

