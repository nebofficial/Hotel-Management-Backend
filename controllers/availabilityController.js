const { buildAvailabilityCalendar } = require('../utils/availabilityEngine');
const { summarizeOverbookings } = require('../utils/overbookingChecker');
const { asDate } = require('../utils/dateUtils');

function getRangeForView(view, start) {
  const base = asDate(start) || new Date();
  const s = new Date(base);
  s.setHours(0, 0, 0, 0);
  const e = new Date(s);

  const v = String(view || 'weekly').toLowerCase();
  if (v === 'daily') {
    // 1 day range
  } else if (v === 'monthly') {
    e.setDate(e.getDate() + 29);
  } else {
    // weekly default: 7 days
    e.setDate(e.getDate() + 6);
  }

  return { start: s, end: e };
}

async function getCalendarData(req, res) {
  try {
    const { Room, Booking, WalkinBooking, MaintenanceBlock } = req.hotelModels;
    // Ensure MaintenanceBlock table exists for this schema
    await MaintenanceBlock.sync({ alter: false });

    const { view, start, roomType } = req.query || {};
    const range = getRangeForView(view, start);

    const calendar = await buildAvailabilityCalendar({
      Room,
      Booking,
      WalkinBooking,
      MaintenanceBlock,
      start: range.start,
      end: range.end,
      roomType,
    });

    const overbookingSummary = summarizeOverbookings(calendar);

    res.json({
      ...calendar,
      overbookingSummary,
    });
  } catch (error) {
    console.error('getCalendarData error:', error);
    res.status(500).json({ message: 'Failed to load availability calendar', error: error.message });
  }
}

async function blockRoom(req, res) {
  try {
    const { Room, MaintenanceBlock } = req.hotelModels;
    await MaintenanceBlock.sync({ alter: false });

    const { roomId, startDate, endDate, reason, type } = req.body || {};
    if (!roomId || !startDate || !endDate) {
      return res
        .status(400)
        .json({ message: 'roomId, startDate, and endDate are required for maintenance block' });
    }

    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const s = asDate(startDate);
    const e = asDate(endDate);
    if (!s || !e || e.getTime() < s.getTime()) {
      return res.status(400).json({ message: 'Invalid maintenance date range' });
    }

    const block = await MaintenanceBlock.create({
      roomId: room.id,
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      startDate: s,
      endDate: e,
      reason: reason || null,
      type: type || null,
      isActive: true,
      createdBy: req.user?.id || null,
    });

    res.status(201).json({ block });
  } catch (error) {
    console.error('blockRoom error:', error);
    res.status(500).json({ message: 'Failed to create maintenance block', error: error.message });
  }
}

async function releaseBlock(req, res) {
  try {
    const { MaintenanceBlock } = req.hotelModels;
    await MaintenanceBlock.sync({ alter: false });

    const { blockId } = req.params;
    const block = await MaintenanceBlock.findByPk(blockId);
    if (!block) {
      return res.status(404).json({ message: 'Maintenance block not found' });
    }

    await block.update({ isActive: false });

    res.json({ block, message: 'Maintenance block released' });
  } catch (error) {
    console.error('releaseBlock error:', error);
    res.status(500).json({ message: 'Failed to release maintenance block', error: error.message });
  }
}

module.exports = {
  getCalendarData,
  blockRoom,
  releaseBlock,
};

