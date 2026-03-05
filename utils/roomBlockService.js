const { getAvailableRooms } = require('./availabilityChecker');

/**
 * Validate room blocks for a group booking.
 * roomBlocks: [{ roomType, quantity }]
 */
async function validateRoomBlocks({ Room, Booking, checkIn, checkOut, roomBlocks }) {
  const blocks = Array.isArray(roomBlocks) ? roomBlocks : [];
  const issues = [];
  const availabilityByType = {};

  for (const block of blocks) {
    const roomType = String(block.roomType || '').trim();
    const quantity = Number(block.quantity || 0);
    if (!roomType || quantity <= 0) continue;

    const { availableRooms } = await getAvailableRooms({
      Room,
      Booking,
      checkIn,
      checkOut,
      roomType,
    });

    const availableCount = availableRooms.length;
    availabilityByType[roomType] = {
      available: availableCount,
      requested: quantity,
    };

    if (availableCount < quantity) {
      issues.push({
        roomType,
        available: availableCount,
        requested: quantity,
      });
    }
  }

  const ok = issues.length === 0;
  return { ok, issues, availabilityByType };
}

module.exports = {
  validateRoomBlocks,
};

