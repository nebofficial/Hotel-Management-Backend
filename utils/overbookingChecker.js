/**
 * Additional overbooking analysis helpers.
 * Currently computes summary by room type and date.
 */
function summarizeOverbookings(calendar) {
  const summaryByRoomTypeDate = {};

  const roomsById = {};
  for (const room of calendar.rooms || []) {
    roomsById[room.id] = room;
  }

  for (const ob of calendar.overbookings || []) {
    const room = roomsById[ob.roomId];
    const roomType = room?.roomType || 'Unknown';
    const key = `${roomType}::${ob.date}`;
    if (!summaryByRoomTypeDate[key]) {
      summaryByRoomTypeDate[key] = {
        roomType,
        date: ob.date,
        instances: 0,
      };
    }
    summaryByRoomTypeDate[key].instances += 1;
  }

  return Object.values(summaryByRoomTypeDate);
}

module.exports = {
  summarizeOverbookings,
};

