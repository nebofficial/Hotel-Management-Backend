const { sequelize } = require('../config/database');
const { asDate } = require('../utils/dateUtils');
const { calculateRequiredDeposit } = require('../utils/depositService');
const { createKeyCardPayload } = require('../utils/keyCardService');
const { suggestUpgrade } = require('../utils/roomUpgradeEngine');

async function confirmArrival(req, res) {
  try {
    const { bookingId } = req.body || {};
    if (!bookingId) return res.status(400).json({ message: 'bookingId is required' });

    const { Booking, Room, Stay } = req.hotelModels;
    await Stay.sync({ alter: false });

    const booking = await Booking.findByPk(bookingId);
    if (!booking) return res.status(404).json({ message: 'Reservation not found' });

    const room = await Room.findByPk(booking.roomId);
    if (!room) return res.status(404).json({ message: 'Room not found for reservation' });

    const existingStay = await Stay.findOne({ where: { bookingId: String(booking.id) } });
    if (existingStay) {
      return res.json({ booking, stay: existingStay });
    }

    const nights = Math.max(
      1,
      Math.ceil((asDate(booking.checkOut) - asDate(booking.checkIn)) / (1000 * 60 * 60 * 24))
    );
    const requiredDeposit = calculateRequiredDeposit({
      roomType: booking.roomType || room.roomType,
      nightlyRate: booking.roomCostTotal / nights || room.pricePerNight,
      nights,
    });

    const stay = await Stay.create({
      bookingId: String(booking.id),
      guestId: String(booking.guestId),
      guestName: booking.guestName,
      roomId: String(booking.roomId),
      roomNumber: booking.roomNumber,
      roomType: booking.roomType || room.roomType,
      checkIn: booking.checkIn,
      expectedCheckOut: booking.checkOut,
      status: 'in_progress',
      requiredDeposit,
      paidDeposit: Number(booking.advancePaid || 0),
      depositCurrency: 'USD',
      createdBy: req.user?.id || null,
    });

    res.json({ booking, stay });
  } catch (error) {
    console.error('confirmArrival error:', error);
    res.status(500).json({ message: 'Failed to confirm arrival', error: error.message });
  }
}

async function assignRoom(req, res) {
  try {
    const { bookingId, roomId, upgradeRequested } = req.body || {};
    if (!bookingId) return res.status(400).json({ message: 'bookingId is required' });

    const { Booking, Room, Stay } = req.hotelModels;
    await Stay.sync({ alter: false });

    const booking = await Booking.findByPk(bookingId);
    if (!booking) return res.status(404).json({ message: 'Reservation not found' });

    let targetRoomId = roomId || booking.roomId;
    let upgradeRoom = null;

    if (upgradeRequested) {
      upgradeRoom = await suggestUpgrade({ Room, currentRoomId: booking.roomId });
      if (upgradeRoom) {
        targetRoomId = upgradeRoom.id;
      }
    }

    const room = await Room.findByPk(targetRoomId);
    if (!room) return res.status(404).json({ message: 'Target room not found' });

    await booking.update({
      roomId: String(room.id),
      roomNumber: room.roomNumber,
      roomType: room.roomType,
    });

    const stay = await Stay.findOne({ where: { bookingId: String(booking.id) } });
    if (stay) {
      await stay.update({
        roomId: String(room.id),
        roomNumber: room.roomNumber,
        roomType: room.roomType,
      });
    }

    res.json({ booking, stay });
  } catch (error) {
    console.error('assignRoom error:', error);
    res.status(500).json({ message: 'Failed to assign room', error: error.message });
  }
}

async function collectDeposit(req, res) {
  try {
    const { bookingId, amount, mode } = req.body || {};
    if (!bookingId) return res.status(400).json({ message: 'bookingId is required' });

    const { Booking, Stay, Payment } = req.hotelModels;
    await Stay.sync({ alter: false });

    const booking = await Booking.findByPk(bookingId);
    if (!booking) return res.status(404).json({ message: 'Reservation not found' });

    const stay = await Stay.findOne({ where: { bookingId: String(booking.id) } });
    if (!stay) return res.status(404).json({ message: 'Stay not initialized for this booking' });

    const amt = Number(amount || 0);
    if (amt <= 0) return res.status(400).json({ message: 'Deposit amount must be > 0' });

    const newPaid = Number(stay.paidDeposit || 0) + amt;

    const payment = await Payment.create({
      bookingId: String(booking.id),
      amount: amt,
      currency: 'USD',
      paymentMethod: mode || 'cash',
      status: 'completed',
      transactionId: `DEP-${Date.now()}`,
      guestId: String(booking.guestId),
      guestName: String(booking.guestName),
      notes: mode ? `Check-in deposit, mode: ${mode}` : 'Check-in deposit',
    });

    await stay.update({
      paidDeposit: newPaid,
    });

    res.json({ stay, payment });
  } catch (error) {
    console.error('collectDeposit error:', error);
    res.status(500).json({ message: 'Failed to collect deposit', error: error.message });
  }
}

async function activateStay(req, res) {
  try {
    const { bookingId, signatureImage, keyCardNumber: inputCardNumber } = req.body || {};
    if (!bookingId) return res.status(400).json({ message: 'bookingId is required' });

    const { Booking, Room, Stay } = req.hotelModels;
    await Stay.sync({ alter: false });

    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    const stay = await Stay.findOne({ where: { bookingId: String(booking.id) } });
    if (!stay) {
      return res
        .status(400)
        .json({ message: 'Stay not initialized for this booking. Please confirm arrival first.' });
    }

    const room = await Room.findByPk(booking.roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found for this reservation' });
    }

    const keyPayload = createKeyCardPayload({
      roomNumber: booking.roomNumber,
      checkOut: booking.checkOut,
    });

    const keyCardNumber = inputCardNumber || keyPayload.keyCardNumber;

    const result = await sequelize.transaction(async (t) => {
      await stay.update(
        {
          status: 'checked_in',
          signatureImage: signatureImage || stay.signatureImage,
          keyCardNumber,
          keyCardActivatedAt: keyPayload.activatedAt,
          keyCardValidUntil: keyPayload.validUntil,
        },
        { transaction: t }
      );

      await booking.update(
        {
          status: 'checked_in',
        },
        { transaction: t }
      );

      await room.update(
        {
          status: 'occupied',
        },
        { transaction: t }
      );

      return { booking, stay, room, keyCardNumber };
    });

    res.json(result);
  } catch (error) {
    console.error('activateStay error:', error);
    res.status(500).json({ message: error.message || 'Failed to activate stay' });
  }
}

module.exports = {
  confirmArrival,
  assignRoom,
  collectDeposit,
  activateStay,
};

