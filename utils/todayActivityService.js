const { Op } = require('sequelize');

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function mapBookingToActivity(booking, roomMap) {
  const roomInfo = roomMap[booking.roomId] || {};
  return {
    id: booking.id,
    bookingNumber: booking.bookingNumber,
    guestName: booking.guestName,
    guestPhone: booking.guestPhone,
    roomId: booking.roomId,
    roomNumber: booking.roomNumber || roomInfo.roomNumber || null,
    roomType: roomInfo.roomType || booking.roomType || null,
    roomStatus: roomInfo.status || null,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    status: booking.status,
  };
}

async function buildTodayCheckins({ Booking, Room, statusFilter }) {
  const now = new Date();
  const from = startOfDay(now);
  const to = endOfDay(now);

  const rooms = await Room.findAll().catch(() => []);
  const roomMap = {};
  rooms.forEach((r) => {
    roomMap[r.id] = {
      roomNumber: r.roomNumber,
      roomType: r.roomType,
      status: r.status,
    };
  });

  const where = {
    checkIn: { [Op.between]: [from, to] },
    status: { [Op.in]: ['pending', 'confirmed', 'checked_in'] },
  };

  if (statusFilter === 'pending') {
    where.status = { [Op.in]: ['pending', 'confirmed'] };
  } else if (statusFilter === 'checked_in') {
    where.status = 'checked_in';
  }

  const rows = await Booking.findAll({
    where,
    order: [['checkIn', 'ASC']],
  }).catch(() => []);

  return rows.map((b) => mapBookingToActivity(b, roomMap));
}

async function buildTodayCheckouts({ Booking, Room, statusFilter }) {
  const now = new Date();
  const from = startOfDay(now);
  const to = endOfDay(now);

  const rooms = await Room.findAll().catch(() => []);
  const roomMap = {};
  rooms.forEach((r) => {
    roomMap[r.id] = {
      roomNumber: r.roomNumber,
      roomType: r.roomType,
      status: r.status,
    };
  });

  const where = {
    checkOut: { [Op.between]: [from, to] },
    status: { [Op.in]: ['checked_in', 'checked_out'] },
  };

  if (statusFilter === 'pending_checkout') {
    where.status = 'checked_in';
  } else if (statusFilter === 'checked_out') {
    where.status = 'checked_out';
  }

  const rows = await Booking.findAll({
    where,
    order: [['checkOut', 'ASC']],
  }).catch(() => []);

  return rows.map((b) => mapBookingToActivity(b, roomMap));
}

async function quickCheckin({ Booking, Room, bookingId }) {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404;
    throw err;
  }

  booking.status = 'checked_in';
  await booking.save().catch(() => {});

  if (booking.roomId) {
    const room = await Room.findByPk(booking.roomId).catch(() => null);
    if (room) {
      room.status = 'occupied';
      await room.save().catch(() => {});
    }
  }

  return booking;
}

async function quickCheckout({ Booking, Room, bookingId }) {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404;
    throw err;
  }

  booking.status = 'checked_out';
  await booking.save().catch(() => {});

  if (booking.roomId) {
    const room = await Room.findByPk(booking.roomId).catch(() => null);
    if (room) {
      room.status = 'available';
      await room.save().catch(() => {});
    }
  }

  return booking;
}

module.exports = {
  buildTodayCheckins,
  buildTodayCheckouts,
  quickCheckin,
  quickCheckout,
};

