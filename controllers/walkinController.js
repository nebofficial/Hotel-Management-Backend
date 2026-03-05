const { sequelize } = require('../config/database');
const { Op } = require('sequelize');
const { getNextWalkinNumber, getNextBillNumber } = require('../utils/walkinNumberGenerator');
const { calculateWalkinPricing, diffNights } = require('../utils/walkinPricingService');

function asDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

/**
 * Get next walk-in number
 */
async function nextWalkinNumber(req, res) {
  try {
    const { WalkinBooking } = req.hotelModels;
    await WalkinBooking.sync({ alter: false });
    const walkinNumber = await getNextWalkinNumber(WalkinBooking, new Date().getFullYear());
    res.json({ walkinNumber });
  } catch (error) {
    console.error('nextWalkinNumber error:', error);
    res.status(500).json({ message: 'Failed to generate walk-in number', error: error.message });
  }
}

/**
 * Get available rooms for walk-in (real-time)
 */
async function getAvailableRooms(req, res) {
  try {
    const { Room, WalkinBooking, Booking } = req.hotelModels;
    const { roomType, checkOut } = req.query;

    const now = new Date();
    const expectedCheckOut = checkOut ? asDate(checkOut) : new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Get rooms currently occupied by walk-ins
    const occupiedWalkins = await WalkinBooking.findAll({
      attributes: ['roomId'],
      where: {
        status: 'checked_in',
        expectedCheckOut: { [Op.gt]: now },
      },
    });
    const walkinRoomIds = occupiedWalkins.map((w) => String(w.roomId));

    // Get rooms occupied by regular bookings
    const occupiedBookings = await Booking.findAll({
      attributes: ['roomId'],
      where: {
        status: { [Op.in]: ['confirmed', 'checked_in'] },
        checkIn: { [Op.lte]: expectedCheckOut },
        checkOut: { [Op.gt]: now },
      },
    });
    const bookingRoomIds = occupiedBookings.map((b) => String(b.roomId));

    const occupiedIds = [...new Set([...walkinRoomIds, ...bookingRoomIds])];

    const whereRoom = roomType ? { roomType } : {};
    const rooms = await Room.findAll({
      where: whereRoom,
      order: [['roomNumber', 'ASC']],
    });

    const availableRooms = rooms
      .map((r) => r.toJSON())
      .filter((r) => !occupiedIds.includes(String(r.id)));

    res.json({ availableRooms, totalAvailable: availableRooms.length });
  } catch (error) {
    console.error('getAvailableRooms error:', error);
    res.status(500).json({ message: 'Failed to get available rooms', error: error.message });
  }
}

/**
 * Calculate rate for walk-in
 */
async function calculateRate(req, res) {
  try {
    const { checkIn, checkOut, baseRoomRate, occupancyType, extraBed, extraServices } = req.body;

    const ci = asDate(checkIn) || new Date();
    const co = asDate(checkOut);
    if (!co) {
      return res.status(400).json({ message: 'Check-out date is required' });
    }

    const pricing = calculateWalkinPricing({
      checkIn: ci,
      checkOut: co,
      baseRoomRate: Number(baseRoomRate || 0),
      occupancyType: occupancyType || 'single',
      extraBed: Boolean(extraBed),
      extraServices: extraServices || [],
    });

    res.json(pricing);
  } catch (error) {
    console.error('calculateRate error:', error);
    res.status(500).json({ message: 'Failed to calculate rate', error: error.message });
  }
}

/**
 * Check if guest exists by phone
 */
async function lookupGuest(req, res) {
  try {
    const { Guest } = req.hotelModels;
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const guest = await Guest.findOne({
      where: { phone: String(phone).trim() },
    });

    if (guest) {
      res.json({ found: true, guest: guest.toJSON() });
    } else {
      res.json({ found: false, guest: null });
    }
  } catch (error) {
    console.error('lookupGuest error:', error);
    res.status(500).json({ message: 'Failed to lookup guest', error: error.message });
  }
}

/**
 * Create walk-in booking (immediate check-in)
 */
async function createWalkin(req, res) {
  try {
    const { WalkinBooking, Guest, Room } = req.hotelModels;

    await WalkinBooking.sync({ alter: false });

    const {
      guestName,
      guestPhone,
      guestEmail,
      numberOfGuests,
      idProofType,
      idProofNumber,
      idProofImage,
      roomId,
      expectedCheckOut,
      occupancyType,
      extraBed,
      extraServices,
      paidAmount,
      paymentMode,
      paymentDetails,
      specialRequests,
    } = req.body;

    if (!guestName || !guestPhone || !roomId || !expectedCheckOut) {
      return res.status(400).json({
        message: 'Guest name, phone, room, and expected check-out are required',
      });
    }

    const checkOutDate = asDate(expectedCheckOut);
    if (!checkOutDate) {
      return res.status(400).json({ message: 'Invalid check-out date' });
    }

    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const result = await sequelize.transaction(async (t) => {
      // Check if room is still available
      const existingWalkin = await WalkinBooking.findOne({
        where: {
          roomId,
          status: 'checked_in',
          expectedCheckOut: { [Op.gt]: new Date() },
        },
        transaction: t,
      });

      if (existingWalkin) {
        throw new Error('Room is already occupied');
      }

      // Create or update guest profile
      let guest = await Guest.findOne({
        where: { phone: String(guestPhone).trim() },
        transaction: t,
      });

      if (!guest) {
        const nameParts = String(guestName).trim().split(' ');
        const firstName = nameParts[0] || 'Guest';
        const lastName = nameParts.slice(1).join(' ') || '';

        guest = await Guest.create(
          {
            firstName,
            lastName,
            phone: String(guestPhone).trim(),
            email: guestEmail || `${String(guestPhone).trim()}@walkin.local`,
            idType: idProofType || null,
            idNumber: idProofNumber || null,
          },
          { transaction: t }
        );
      }

      const checkIn = new Date();
      const pricing = calculateWalkinPricing({
        checkIn,
        checkOut: checkOutDate,
        baseRoomRate: Number(room.pricePerNight || 0),
        occupancyType: occupancyType || 'single',
        extraBed: Boolean(extraBed),
        extraServices: extraServices || [],
      });

      const paid = Number(paidAmount || 0);
      const balance = Math.max(0, pricing.totalAmount - paid);

      const walkinNumber = await getNextWalkinNumber(WalkinBooking, new Date().getFullYear());
      const billNumber = await getNextBillNumber(WalkinBooking, new Date().getFullYear());

      const walkin = await WalkinBooking.create(
        {
          walkinNumber,
          guestId: guest.id,
          guestName: String(guestName).trim(),
          guestPhone: String(guestPhone).trim(),
          guestEmail: guestEmail || null,
          numberOfGuests: Number(numberOfGuests || 1),
          idProofType: idProofType || null,
          idProofNumber: idProofNumber || null,
          idProofImage: idProofImage || null,
          roomId: room.id,
          roomNumber: room.roomNumber,
          roomType: room.roomType,
          checkInTime: checkIn,
          expectedCheckOut: checkOutDate,
          numberOfNights: pricing.nights,
          occupancyType: occupancyType || 'single',
          baseRoomRate: pricing.baseRoomRate,
          occupancyCharge: pricing.occupancyCharge,
          weekendCharge: pricing.weekendCharge,
          seasonalCharge: pricing.seasonalCharge,
          extraBedCharge: pricing.extraBedCharge,
          extraServices: extraServices || [],
          taxAmount: pricing.taxAmount,
          totalAmount: pricing.totalAmount,
          paidAmount: paid,
          balanceAmount: balance,
          paymentMode: paymentMode || 'cash',
          paymentDetails: paymentDetails || {},
          billNumber,
          status: 'checked_in',
          specialRequests: specialRequests || null,
          createdBy: req.user?.id || null,
          pricingBreakdown: pricing,
        },
        { transaction: t }
      );

      // Update room status to occupied
      await Room.update({ status: 'occupied' }, { where: { id: roomId }, transaction: t });

      return { walkin, guest, pricing };
    });

    res.status(201).json({
      walkin: result.walkin,
      guest: result.guest,
      pricing: result.pricing,
    });
  } catch (error) {
    console.error('createWalkin error:', error);
    res.status(500).json({ message: error.message || 'Failed to create walk-in booking' });
  }
}

/**
 * List walk-in bookings with filters
 */
async function listWalkins(req, res) {
  try {
    const { WalkinBooking } = req.hotelModels;
    await WalkinBooking.sync({ alter: false });

    const { status, dateFrom, dateTo, search, page = 1, limit = 20 } = req.query;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.checkInTime = {};
      if (dateFrom) where.checkInTime[Op.gte] = asDate(dateFrom);
      if (dateTo) where.checkInTime[Op.lte] = asDate(dateTo);
    }

    if (search) {
      const s = `%${search}%`;
      where[Op.or] = [
        { walkinNumber: { [Op.iLike]: s } },
        { guestName: { [Op.iLike]: s } },
        { guestPhone: { [Op.iLike]: s } },
        { roomNumber: { [Op.iLike]: s } },
      ];
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { rows, count } = await WalkinBooking.findAndCountAll({
      where,
      order: [['checkInTime', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      walkins: rows,
      total: count,
      page: Number(page),
      totalPages: Math.ceil(count / Number(limit)),
    });
  } catch (error) {
    console.error('listWalkins error:', error);
    res.status(500).json({ message: 'Failed to list walk-in bookings', error: error.message });
  }
}

/**
 * Get single walk-in by ID
 */
async function getWalkin(req, res) {
  try {
    const { WalkinBooking } = req.hotelModels;
    const { walkinId } = req.params;

    const walkin = await WalkinBooking.findByPk(walkinId);
    if (!walkin) {
      return res.status(404).json({ message: 'Walk-in booking not found' });
    }

    res.json({ walkin });
  } catch (error) {
    console.error('getWalkin error:', error);
    res.status(500).json({ message: 'Failed to get walk-in booking', error: error.message });
  }
}

/**
 * Check out walk-in guest
 */
async function checkoutWalkin(req, res) {
  try {
    const { WalkinBooking, Room } = req.hotelModels;
    const { walkinId } = req.params;
    const { additionalPayment, paymentMode } = req.body;

    const walkin = await WalkinBooking.findByPk(walkinId);
    if (!walkin) {
      return res.status(404).json({ message: 'Walk-in booking not found' });
    }

    if (walkin.status !== 'checked_in') {
      return res.status(400).json({ message: 'Walk-in is not currently checked in' });
    }

    const addPay = Number(additionalPayment || 0);
    const newPaid = Number(walkin.paidAmount || 0) + addPay;
    const newBalance = Math.max(0, Number(walkin.totalAmount || 0) - newPaid);

    await walkin.update({
      status: 'checked_out',
      actualCheckOut: new Date(),
      paidAmount: newPaid,
      balanceAmount: newBalance,
      paymentMode: paymentMode || walkin.paymentMode,
    });

    // Update room status to available
    await Room.update({ status: 'available' }, { where: { id: walkin.roomId } });

    res.json({ walkin, message: 'Guest checked out successfully' });
  } catch (error) {
    console.error('checkoutWalkin error:', error);
    res.status(500).json({ message: 'Failed to check out', error: error.message });
  }
}

/**
 * Cancel walk-in booking
 */
async function cancelWalkin(req, res) {
  try {
    const { WalkinBooking, Room } = req.hotelModels;
    const { walkinId } = req.params;
    const { reason } = req.body;

    const walkin = await WalkinBooking.findByPk(walkinId);
    if (!walkin) {
      return res.status(404).json({ message: 'Walk-in booking not found' });
    }

    if (walkin.status === 'checked_out') {
      return res.status(400).json({ message: 'Cannot cancel a checked-out booking' });
    }

    await walkin.update({
      status: 'cancelled',
      specialRequests: walkin.specialRequests
        ? `${walkin.specialRequests}\n[CANCELLED: ${reason || 'No reason provided'}]`
        : `[CANCELLED: ${reason || 'No reason provided'}]`,
    });

    // Update room status to available
    await Room.update({ status: 'available' }, { where: { id: walkin.roomId } });

    res.json({ walkin, message: 'Walk-in cancelled successfully' });
  } catch (error) {
    console.error('cancelWalkin error:', error);
    res.status(500).json({ message: 'Failed to cancel walk-in', error: error.message });
  }
}

/**
 * Generate bill data for printing
 */
async function generateBill(req, res) {
  try {
    const { WalkinBooking } = req.hotelModels;
    const { walkinId } = req.params;

    const walkin = await WalkinBooking.findByPk(walkinId);
    if (!walkin) {
      return res.status(404).json({ message: 'Walk-in booking not found' });
    }

    const w = walkin.toJSON();
    const bill = {
      billNumber: w.billNumber,
      walkinNumber: w.walkinNumber,
      guestName: w.guestName,
      guestPhone: w.guestPhone,
      roomNumber: w.roomNumber,
      roomType: w.roomType,
      checkIn: w.checkInTime,
      checkOut: w.actualCheckOut || w.expectedCheckOut,
      nights: w.numberOfNights,
      charges: {
        roomCharges: Number(w.baseRoomRate) * w.numberOfNights,
        occupancyCharge: Number(w.occupancyCharge),
        weekendCharge: Number(w.weekendCharge),
        seasonalCharge: Number(w.seasonalCharge),
        extraBedCharge: Number(w.extraBedCharge),
        extraServices: w.extraServices || [],
        taxAmount: Number(w.taxAmount),
      },
      totalAmount: Number(w.totalAmount),
      paidAmount: Number(w.paidAmount),
      balanceAmount: Number(w.balanceAmount),
      paymentMode: w.paymentMode,
      generatedAt: new Date().toISOString(),
    };

    res.json({ bill });
  } catch (error) {
    console.error('generateBill error:', error);
    res.status(500).json({ message: 'Failed to generate bill', error: error.message });
  }
}

/**
 * Generate registration card data for printing
 */
async function generateRegistrationCard(req, res) {
  try {
    const { WalkinBooking, Guest } = req.hotelModels;
    const { walkinId } = req.params;

    const walkin = await WalkinBooking.findByPk(walkinId);
    if (!walkin) {
      return res.status(404).json({ message: 'Walk-in booking not found' });
    }

    const guest = walkin.guestId ? await Guest.findByPk(walkin.guestId) : null;

    const w = walkin.toJSON();
    const card = {
      walkinNumber: w.walkinNumber,
      guestName: w.guestName,
      guestPhone: w.guestPhone,
      guestEmail: w.guestEmail,
      idProofType: w.idProofType,
      idProofNumber: w.idProofNumber,
      roomNumber: w.roomNumber,
      roomType: w.roomType,
      checkIn: w.checkInTime,
      expectedCheckOut: w.expectedCheckOut,
      numberOfGuests: w.numberOfGuests,
      occupancyType: w.occupancyType,
      specialRequests: w.specialRequests,
      address: guest?.address || {},
      generatedAt: new Date().toISOString(),
    };

    res.json({ card });
  } catch (error) {
    console.error('generateRegistrationCard error:', error);
    res.status(500).json({ message: 'Failed to generate registration card', error: error.message });
  }
}

module.exports = {
  nextWalkinNumber,
  getAvailableRooms,
  calculateRate,
  lookupGuest,
  createWalkin,
  listWalkins,
  getWalkin,
  checkoutWalkin,
  cancelWalkin,
  generateBill,
  generateRegistrationCard,
};
