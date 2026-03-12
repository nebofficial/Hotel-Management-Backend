const Notification = require('../models/Notification');
const {
  generateLowAvailabilityAlerts,
  generatePendingReservationAlerts,
  generatePaymentAlerts,
  generateMaintenanceAlerts,
} = require('./alertGenerator');

async function fetchEphemeralAlerts(hotelModels) {
  const { Room, Booking, RoomBill, MaintenanceRequest } = hotelModels;

  const [lowAvailability, pendingReservations, payments, maintenance] =
    await Promise.all([
      generateLowAvailabilityAlerts({ Room, Booking }).catch(() => []),
      generatePendingReservationAlerts({ Booking }).catch(() => []),
      generatePaymentAlerts({ RoomBill }).catch(() => []),
      generateMaintenanceAlerts({ MaintenanceRequest, Room }).catch(() => []),
    ]);

  return [
    ...lowAvailability,
    ...pendingReservations,
    ...payments,
    ...maintenance,
  ];
}

async function listNotifications({ hotelId, hotelModels }) {
  const [dbRows, ephemeral] = await Promise.all([
    Notification.findAll({
      where: {
        hotelId: hotelId || null,
      },
      order: [['createdAt', 'DESC']],
      limit: 50,
    }).catch(() => []),
    fetchEphemeralAlerts(hotelModels),
  ]);

  const mappedDb = dbRows.map((n) => ({
    id: n.id,
    type: n.type,
    level: n.level,
    title: n.title,
    message: n.message,
    isRead: n.isRead,
    createdAt: n.createdAt,
    meta: n.meta || {},
    source: 'db',
  }));

  const mappedEphemeral = ephemeral.map((a, idx) => ({
    id: `ephemeral-${idx}-${a.type}`,
    type: a.type,
    level: a.level,
    title: a.title,
    message: a.message,
    isRead: false,
    createdAt: new Date(),
    meta: a.meta || {},
    source: 'ephemeral',
  }));

  return [...mappedEphemeral, ...mappedDb].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

async function markRead(notificationId) {
  const row = await Notification.findByPk(notificationId).catch(() => null);
  if (!row) {
    const err = new Error('Notification not found');
    err.status = 404;
    throw err;
  }
  row.isRead = true;
  await row.save().catch(() => {});
  return row;
}

module.exports = {
  listNotifications,
  markRead,
};

