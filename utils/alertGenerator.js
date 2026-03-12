const { Op } = require('sequelize');

async function generateLowAvailabilityAlerts({ Room, Booking, threshold = 0.1 }) {
  const rooms = await Room.findAll().catch(() => []);
  const totalRooms = rooms.length;
  if (!totalRooms) return [];

  const today = new Date().toISOString().slice(0, 10);
  const activeBookings = await Booking.findAll({
    where: {
      status: { [Op.in]: ['confirmed', 'checked_in'] },
      checkIn: { [Op.lte]: new Date(today + 'T23:59:59') },
      checkOut: { [Op.gte]: new Date(today) },
    },
  }).catch(() => []);

  const occupiedCount = activeBookings.length;
  const remaining = Math.max(0, totalRooms - occupiedCount);
  const remainingRatio = remaining / totalRooms;

  if (remainingRatio > threshold) return [];

  return [
    {
      type: 'LOW_AVAILABILITY',
      level: 'warning',
      title: 'Low room availability',
      message: `${remaining} of ${totalRooms} rooms remaining for today.`,
      meta: {
        totalRooms,
        remainingRooms: remaining,
        occupiedRooms: occupiedCount,
        threshold,
      },
    },
  ];
}

async function generatePendingReservationAlerts({ Booking }) {
  const today = new Date().toISOString().slice(0, 10);
  const pending = await Booking.findAll({
    where: {
      status: 'pending',
      checkIn: { [Op.gte]: new Date(today) },
    },
    limit: 20,
  }).catch(() => []);

  if (!pending.length) return [];

  return [
    {
      type: 'PENDING_RESERVATIONS',
      level: 'info',
      title: 'Pending reservations awaiting confirmation',
      message: `${pending.length} reservation(s) are still pending confirmation.`,
      meta: {
        count: pending.length,
      },
    },
  ];
}

async function generatePaymentAlerts({ RoomBill }) {
  const bills = await RoomBill.findAll({
    where: {
      status: { [Op.in]: ['PENDING'] },
    },
    limit: 20,
  }).catch(() => []);

  if (!bills.length) return [];

  const totalDue = bills.reduce(
    (sum, b) => sum + parseFloat(b.netPayable || 0),
    0
  );

  return [
    {
      type: 'PAYMENT_PENDING',
      level: 'warning',
      title: 'Pending guest payments',
      message: `${bills.length} bill(s) are pending payment. Total due: ${totalDue.toFixed(
        0
      )}.`,
      meta: {
        count: bills.length,
        totalDue,
      },
    },
  ];
}

async function generateMaintenanceAlerts({ MaintenanceRequest, Room }) {
  if (!MaintenanceRequest) return [];
  const open = await MaintenanceRequest.findAll({
    where: { status: { [Op.in]: ['OPEN', 'IN_PROGRESS'] } },
    limit: 20,
  }).catch(() => []);
  if (!open.length) return [];

  const roomIds = open.map((m) => m.roomId).filter(Boolean);
  const rooms = roomIds.length
    ? await Room.findAll({ where: { id: { [Op.in]: roomIds } } }).catch(() => [])
    : [];
  const roomMap = {};
  rooms.forEach((r) => {
    roomMap[r.id] = r.roomNumber;
  });

  return [
    {
      type: 'MAINTENANCE',
      level: 'warning',
      title: 'Maintenance issues open',
      message: `${open.length} maintenance ticket(s) are still open.`,
      meta: {
        count: open.length,
        rooms: open
          .map((m) => roomMap[m.roomId] || null)
          .filter(Boolean)
          .slice(0, 5),
      },
    },
  ];
}

module.exports = {
  generateLowAvailabilityAlerts,
  generatePendingReservationAlerts,
  generatePaymentAlerts,
  generateMaintenanceAlerts,
};

