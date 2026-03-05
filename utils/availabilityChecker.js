const { Op } = require('sequelize');
const { asDate } = require('./dateUtils');

/**
 * Get available rooms for a date range, excluding cancelled/checked-out and tentative bookings.
 * Optionally exclude a specific booking (when modifying an existing reservation).
 */
async function getAvailableRooms({ Room, Booking, checkIn, checkOut, roomType, excludeBookingId }) {
  const ci = asDate(checkIn);
  const co = asDate(checkOut);
  if (!ci || !co) return { availableRooms: [], bookedRoomIds: [] };

  const whereBooking = {
    isTentative: false,
    status: { [Op.notIn]: ['cancelled', 'checked_out'] },
    checkIn: { [Op.lt]: co },
    checkOut: { [Op.gt]: ci },
  };

  if (excludeBookingId) {
    whereBooking.id = { [Op.ne]: excludeBookingId };
  }

  const overlapping = await Booking.findAll({
    attributes: ['roomId'],
    where: whereBooking,
  });

  const bookedRoomIds = overlapping
    .map((b) => String(b.roomId || '').trim())
    .filter(Boolean);

  const whereRoom = {
    ...(roomType ? { roomType: String(roomType) } : {}),
  };

  const rooms = await Room.findAll({
    where: whereRoom,
    order: [['roomNumber', 'ASC']],
  });

  const availableRooms = rooms
    .map((r) => r.toJSON())
    .filter((r) => !bookedRoomIds.includes(String(r.id)));

  return { availableRooms, bookedRoomIds };
}

module.exports = {
  getAvailableRooms,
};

