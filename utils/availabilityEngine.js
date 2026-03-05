const { Op } = require('sequelize');
const { asDate } = require('./dateUtils');

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function toISODate(d) {
  return startOfDay(d).toISOString().slice(0, 10);
}

function buildDateRange(start, end) {
  const dates = [];
  let cur = startOfDay(start);
  const last = startOfDay(end);
  while (cur.getTime() <= last.getTime()) {
    dates.push(toISODate(cur));
    cur = addDays(cur, 1);
  }
  return dates;
}

/**
 * Build room availability calendar matrix for the given range.
 *
 * Returns:
 * {
 *   startDate, endDate,
 *   dates: [YYYY-MM-DD],
 *   rooms: [{ id, roomNumber, roomType, floor }],
 *   cells: { [roomId]: { [date]: { status, reservations: [...], blocks: [...] } } },
 *   overbookings: [{ roomId, roomNumber, date, count }]
 * }
 */
async function buildAvailabilityCalendar({
  Room,
  Booking,
  WalkinBooking,
  MaintenanceBlock,
  start,
  end,
  roomType,
}) {
  const startDate = startOfDay(asDate(start) || new Date());
  const endDate = startOfDay(asDate(end) || addDays(startDate, 6));

  const dates = buildDateRange(startDate, endDate);

  const roomWhere = {};
  if (roomType) {
    roomWhere.roomType = String(roomType);
  }

  const rooms = await Room.findAll({
    where: roomWhere,
    order: [
      ['floor', 'ASC'],
      ['roomNumber', 'ASC'],
    ],
  });

  if (!rooms.length) {
    return {
      startDate: toISODate(startDate),
      endDate: toISODate(endDate),
      dates,
      rooms: [],
      cells: {},
      overbookings: [],
    };
  }

  const roomIds = rooms.map((r) => String(r.id));

  const bookingWhere = {
    roomId: { [Op.in]: roomIds },
    status: { [Op.notIn]: ['cancelled'] },
    checkIn: { [Op.lt]: addDays(endDate, 1) },
    checkOut: { [Op.gt]: startDate },
  };

  const bookings = await Booking.findAll({ where: bookingWhere });

  const walkinWhere = {
    roomId: { [Op.in]: roomIds },
    isActive: { [Op.or]: [true, null] },
  };

  // Walk-in overlap window
  const walkins = await WalkinBooking.findAll({
    where: {
      roomId: { [Op.in]: roomIds },
      status: { [Op.in]: ['checked_in', 'checked_out'] },
      checkInTime: { [Op.lt]: addDays(endDate, 1) },
      expectedCheckOut: { [Op.gt]: startDate },
    },
  }).catch(() => []);

  const blocks = await MaintenanceBlock.findAll({
    where: {
      roomId: { [Op.in]: roomIds },
      isActive: true,
      startDate: { [Op.lt]: addDays(endDate, 1) },
      endDate: { [Op.gt]: startDate },
    },
  }).catch(() => []);

  const cells = {};
  const overbookings = [];

  for (const room of rooms) {
    const rid = String(room.id);
    cells[rid] = {};
    for (const d of dates) {
      cells[rid][d] = {
        status: 'available',
        reservations: [],
        blocks: [],
      };
    }
  }

  function fillRange(entity, roomId, from, to, fn) {
    const rid = String(roomId);
    const startD = startOfDay(from);
    const endD = addDays(startOfDay(to), -1); // end is exclusive
    let cur = startD;
    while (cur.getTime() <= endD.getTime()) {
      const key = toISODate(cur);
      if (cells[rid] && cells[rid][key]) {
        fn(cells[rid][key], key);
      }
      cur = addDays(cur, 1);
    }
  }

  for (const b of bookings) {
    const rid = String(b.roomId);
    if (!cells[rid]) continue;
    const ci = new Date(b.checkIn);
    const co = new Date(b.checkOut);
    const nights = Math.max(1, Math.round((startOfDay(co) - startOfDay(ci)) / (24 * 60 * 60 * 1000)));

    fillRange(
      b,
      b.roomId,
      ci,
      co,
      (cell, dateKey) => {
        const isStart = dateKey === toISODate(ci);
        const seg = {
          kind: 'reservation',
          bookingId: b.id,
          bookingNumber: b.bookingNumber,
          guestName: b.guestName,
          checkIn: b.checkIn,
          checkOut: b.checkOut,
          nights,
          isStart,
          source: 'booking',
        };
        cell.reservations.push(seg);
      }
    );
  }

  for (const w of walkins) {
    const rid = String(w.roomId);
    if (!cells[rid]) continue;
    const ci = new Date(w.checkInTime);
    const co = new Date(w.actualCheckOut || w.expectedCheckOut);
    const nights = Math.max(1, Math.round((startOfDay(co) - startOfDay(ci)) / (24 * 60 * 60 * 1000)));

    fillRange(
      w,
      w.roomId,
      ci,
      co,
      (cell, dateKey) => {
        const isStart = dateKey === toISODate(ci);
        const seg = {
          kind: 'walkin',
          bookingId: w.id,
          bookingNumber: w.walkinNumber,
          guestName: w.guestName,
          checkIn: w.checkInTime,
          checkOut: w.actualCheckOut || w.expectedCheckOut,
          nights,
          isStart,
          source: 'walkin',
        };
        cell.reservations.push(seg);
      }
    );
  }

  for (const mb of blocks) {
    const rid = String(mb.roomId);
    if (!cells[rid]) continue;
    const startB = new Date(mb.startDate);
    const endB = new Date(mb.endDate);

    fillRange(
      mb,
      mb.roomId,
      startB,
      endB,
      (cell) => {
        cell.blocks.push({
          id: mb.id,
          reason: mb.reason,
          type: mb.type,
        });
      }
    );
  }

  for (const room of rooms) {
    const rid = String(room.id);
    for (const d of dates) {
      const cell = cells[rid][d];
      const hasBlock = cell.blocks.length > 0;
      const resCount = cell.reservations.length;

      if (hasBlock) {
        cell.status = 'maintenance';
      } else if (resCount === 0) {
        cell.status = 'available';
      } else if (resCount === 1) {
        const r = cell.reservations[0];
        const todayKey = toISODate(new Date());
        if (d < todayKey) {
          cell.status = 'occupied';
        } else if (d === todayKey) {
          cell.status = 'occupied';
        } else {
          cell.status = 'reserved';
        }
      } else {
        cell.status = 'overbooked';
        overbookings.push({
          roomId: rid,
          roomNumber: room.roomNumber,
          date: d,
          count: resCount,
        });
      }
    }
  }

  return {
    startDate: toISODate(startDate),
    endDate: toISODate(endDate),
    dates,
    rooms: rooms.map((r) => ({
      id: String(r.id),
      roomNumber: r.roomNumber,
      roomType: r.roomType,
      floor: r.floor,
    })),
    cells,
    overbookings,
  };
}

module.exports = {
  buildAvailabilityCalendar,
  buildDateRange,
};

