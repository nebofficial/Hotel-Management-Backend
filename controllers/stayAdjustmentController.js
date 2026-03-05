const { calculateHourlyCharge } = require('../utils/hourlyRateEngine');
const { requiresApproval } = require('../utils/approvalService');

function toJson(model) {
  return model && typeof model.toJSON === 'function' ? model.toJSON() : model;
}

async function getStay(req, res) {
  try {
    const { bookingId } = req.query || {};
    if (!bookingId) return res.status(400).json({ message: 'bookingId is required' });

    const { Booking, Stay, StayCharge, StayApproval } = req.hotelModels;
    await Stay.sync({ alter: false });
    await StayCharge.sync({ alter: false });
    await StayApproval.sync({ alter: false });

    const booking = await Booking.findByPk(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const stay = await Stay.findOne({ where: { bookingId: String(bookingId) } });
    const charges = await StayCharge.findAll({ where: { bookingId: String(bookingId) } });
    const approval = await StayApproval.findOne({ where: { bookingId: String(bookingId) } });

    res.json({
      booking: toJson(booking),
      stay: stay ? toJson(stay) : null,
      charges: charges.map(toJson),
      approval: approval ? toJson(approval) : null,
    });
  } catch (error) {
    console.error('getStay error:', error);
    res.status(500).json({ message: 'Failed to load stay', error: error.message });
  }
}

async function calculateCharge(req, res) {
  try {
    const { bookingId, requestedCheckIn, requestedCheckOut } = req.body || {};
    if (!bookingId) return res.status(400).json({ message: 'bookingId is required' });

    const { Booking, Stay } = req.hotelModels;
    await Stay.sync({ alter: false });

    const booking = await Booking.findByPk(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const stay = await Stay.findOne({ where: { bookingId: String(bookingId) } });

    const standardCheckIn = booking.checkIn;
    const standardCheckOut = booking.checkOut;
    const nightlyRate = booking.roomCostTotal || booking.totalAmount || 0;

    const result = calculateHourlyCharge({
      standardCheckIn,
      standardCheckOut,
      requestedCheckIn: requestedCheckIn || standardCheckIn,
      requestedCheckOut: requestedCheckOut || standardCheckOut,
      nightlyRate,
    });

    const approvalRequired = requiresApproval({ totalCharge: result.totalExtraCharge });

    res.json({
      standardCheckIn,
      standardCheckOut,
      nightlyRate,
      ...result,
      approvalRequired,
    });
  } catch (error) {
    console.error('calculateCharge error:', error);
    res.status(500).json({ message: 'Failed to calculate charge', error: error.message });
  }
}

async function requestApproval(req, res) {
  try {
    const { bookingId, managerName, reason, totalCharge } = req.body || {};
    if (!bookingId) return res.status(400).json({ message: 'bookingId is required' });

    const { Stay, StayApproval } = req.hotelModels;
    await Stay.sync({ alter: false });
    await StayApproval.sync({ alter: false });

    const stay = await Stay.findOne({ where: { bookingId: String(bookingId) } });
    if (!stay) return res.status(404).json({ message: 'Stay not found' });

    const required = requiresApproval({ totalCharge });
    const now = new Date();

    let approval = await StayApproval.findOne({ where: { bookingId: String(bookingId) } });
    if (!approval) {
      approval = await StayApproval.create({
        stayId: String(stay.id),
        bookingId: String(bookingId),
        required,
        status: required ? 'PENDING' : 'NOT_REQUIRED',
        managerName: managerName || null,
        reason: reason || null,
        totalCharge: Number(totalCharge || 0),
      });
    } else {
      await approval.update({
        required,
        status: required ? 'PENDING' : 'NOT_REQUIRED',
        managerName: managerName || approval.managerName,
        reason: reason || approval.reason,
        totalCharge: Number(totalCharge || approval.totalCharge || 0),
        decidedBy: null,
        decidedAt: null,
      });
    }

    res.json({ approval: toJson(approval) });
  } catch (error) {
    console.error('requestApproval error:', error);
    res.status(500).json({ message: 'Failed to request approval', error: error.message });
  }
}

async function applyCharge(req, res) {
  try {
    const { bookingId, type, description, hoursEarly, hoursLate, amount } = req.body || {};
    if (!bookingId) return res.status(400).json({ message: 'bookingId is required' });

    const { Stay, StayCharge } = req.hotelModels;
    await Stay.sync({ alter: false });
    await StayCharge.sync({ alter: false });

    const stay = await Stay.findOne({ where: { bookingId: String(bookingId) } });
    if (!stay) return res.status(404).json({ message: 'Stay not found' });

    const charge = await StayCharge.create({
      stayId: String(stay.id),
      bookingId: String(bookingId),
      type: type || 'both',
      description: description || null,
      hoursEarly: Number(hoursEarly || 0),
      hoursLate: Number(hoursLate || 0),
      amount: Number(amount || 0),
      createdBy: req.user?.id || null,
    });

    res.json({ charge: toJson(charge) });
  } catch (error) {
    console.error('applyCharge error:', error);
    res.status(500).json({ message: 'Failed to apply charge', error: error.message });
  }
}

async function notifyHousekeeping(req, res) {
  try {
    const { bookingId, roomId, type, requestedCheckIn, requestedCheckOut } = req.body || {};
    if (!bookingId) return res.status(400).json({ message: 'bookingId is required' });

    const { Booking, Stay, HousekeepingTask } = req.hotelModels;
    await HousekeepingTask.sync({ alter: false });

    const booking = await Booking.findByPk(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const stay = await Stay.findOne({ where: { bookingId: String(bookingId) } }).catch(() => null);

    const cleaningType =
      type === 'early_checkin'
        ? 'Priority Clean (Early Check-in)'
        : type === 'late_checkout'
        ? 'Delayed Clean (Late Check-out)'
        : 'Schedule Adjusted (Early/Late Stay)';

    const schedule =
      requestedCheckIn || requestedCheckOut || stay?.expectedCheckOut || booking.checkOut || new Date().toISOString();

    const task = await HousekeepingTask.create({
      roomNumber: booking.roomNumber,
      housekeeper: 'Unassigned',
      cleaningType,
      schedule: new Date(schedule).toISOString(),
      status: 'Pending',
      notes: `Auto-created from stay adjustment for guest ${booking.guestName}.`,
    });

    res.json({
      ok: true,
      message: 'Housekeeping task created for this adjustment.',
      task: toJson(task),
    });
  } catch (error) {
    console.error('notifyHousekeeping error:', error);
    res.status(500).json({ message: 'Failed to notify housekeeping', error: error.message });
  }
}

module.exports = {
  getStay,
  calculateCharge,
  requestApproval,
  applyCharge,
  notifyHousekeeping,
};

