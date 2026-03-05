const { sequelize } = require('../config/database');
const { getNextReservationNumber } = require('../utils/reservationNumberGenerator');
const { calculatePricing } = require('../utils/pricingService');
const { asDate } = require('../utils/dateUtils');
const { getAvailableRooms } = require('../utils/availabilityChecker');
const { canTransition, normalizeStatus } = require('../utils/statusManager');

function normalizePaymentMethod(mode) {
  const m = String(mode || '').toLowerCase();
  if (m === 'cash') return 'cash';
  if (m === 'card' || m === 'credit_card' || m === 'debit_card') return 'credit_card';
  if (m === 'upi') return 'other';
  return 'other';
}

function fullGuestName(guest) {
  if (!guest) return '';
  if (guest.guestName) return String(guest.guestName).trim();
  const first = String(guest.firstName || '').trim();
  const last = String(guest.lastName || '').trim();
  return [first, last].filter(Boolean).join(' ').trim();
}

async function nextReservationNumber(req, res) {
  try {
    const { Booking } = req.hotelModels;
    const nextNumber = await getNextReservationNumber(Booking, new Date().getFullYear());
    res.json({ nextNumber });
  } catch (error) {
    console.error('nextReservationNumber error:', error);
    res.status(500).json({ message: 'Failed to generate reservation number' });
  }
}

async function checkAvailability(req, res) {
  try {
    const { Room, Booking } = req.hotelModels;
    const { checkIn, checkOut, roomType } = req.body || {};

    const { availableRooms } = await getAvailableRooms({ Room, Booking, checkIn, checkOut, roomType });

    res.json({
      roomType: roomType || null,
      availableCount: availableRooms.length,
      availableRooms: availableRooms.map((r) => ({
        id: r.id,
        roomNumber: r.roomNumber,
        roomType: r.roomType,
        floor: r.floor,
        capacity: r.capacity,
        pricePerNight: r.pricePerNight,
        amenities: r.amenities || [],
        status: r.status,
      })),
    });
  } catch (error) {
    console.error('checkAvailability error:', error);
    res.status(500).json({ message: 'Failed to check availability' });
  }
}

async function pricingQuote(req, res) {
  try {
    const { Room } = req.hotelModels;
    const {
      checkIn,
      checkOut,
      guests,
      roomId,
      roomType,
      ratePlan,
      extras,
    } = req.body || {};

    let basePricePerNight = 0;
    if (roomId) {
      const room = await Room.findByPk(roomId);
      basePricePerNight = room ? Number(room.pricePerNight || 0) : 0;
    } else if (roomType) {
      const room = await Room.findOne({ where: { roomType: String(roomType) }, order: [['pricePerNight', 'ASC']] });
      basePricePerNight = room ? Number(room.pricePerNight || 0) : 0;
    }

    const quote = calculatePricing({
      checkIn,
      checkOut,
      guests: Number(guests || 1),
      ratePlan,
      basePricePerNight,
      extras: extras || {},
    });

    res.json({ ...quote, roomType: roomType || null, roomId: roomId || null });
  } catch (error) {
    console.error('pricingQuote error:', error);
    res.status(500).json({ message: 'Failed to calculate pricing' });
  }
}

async function createReservation(req, res) {
  const {
    bookingNumber: bookingNumberInput,
    checkIn,
    checkOut,
    numberOfGuests,
    roomType,
    roomId,
    ratePlan,
    specialRequests,
    extras,
    guest,
    payment,
    confirm,
  } = req.body || {};

  const ci = asDate(checkIn);
  const co = asDate(checkOut);
  if (!ci || !co) return res.status(400).json({ message: 'Invalid check-in/check-out dates' });

  try {
    const { Booking, Guest, Room, Payment } = req.hotelModels;

    const result = await sequelize.transaction(async (t) => {
      // Guest upsert
      const g = guest || {};
      const email = String(g.email || '').trim();
      const phone = String(g.phone || g.guestPhone || '').trim();
      const firstName = String(g.firstName || '').trim() || String(fullGuestName(g).split(' ')[0] || '').trim() || 'Guest';
      const lastName = String(g.lastName || '').trim() || String(fullGuestName(g).split(' ').slice(1).join(' ') || '').trim() || 'NA';

      let guestRow = null;
      if (email) guestRow = await Guest.findOne({ where: { email }, transaction: t });
      if (!guestRow && phone) guestRow = await Guest.findOne({ where: { phone }, transaction: t });

      if (guestRow) {
        await guestRow.update(
          {
            firstName,
            lastName,
            email: email || guestRow.email,
            phone: phone || guestRow.phone,
            idType: g.idType || guestRow.idType,
            idNumber: g.idNumber || guestRow.idNumber,
            address: g.address || guestRow.address || {},
          },
          { transaction: t }
        );
      } else {
        guestRow = await Guest.create(
          {
            firstName,
            lastName,
            email: email || `guest_${Date.now()}@example.com`,
            phone: phone || `NA-${Date.now()}`,
            idType: g.idType || null,
            idNumber: g.idNumber || null,
            address: g.address || {},
          },
          { transaction: t }
        );
      }

      const guestName = fullGuestName({ firstName, lastName });

      // Reservation number
      let bookingNumber = (bookingNumberInput && String(bookingNumberInput).trim()) || null;
      if (!bookingNumber) {
        bookingNumber = await getNextReservationNumber(Booking, new Date().getFullYear());
      }

      // Room assignment / availability
      const wantsConfirm = Boolean(confirm);
      let assignedRoom = null;
      let isTentative = !wantsConfirm;

      if (wantsConfirm) {
        const { availableRooms } = await getAvailableRooms({
          Room,
          Booking,
          checkIn: ci,
          checkOut: co,
          roomType,
        });

        if (roomId) {
          assignedRoom = availableRooms.find((r) => String(r.id) === String(roomId));
          if (!assignedRoom) {
            return { error: { status: 409, message: 'Selected room is not available for these dates' } };
          }
        } else {
          assignedRoom = availableRooms[0] || null;
          if (!assignedRoom) {
            return { error: { status: 409, message: 'No rooms available for selected dates and room type' } };
          }
        }
      }

      // Pricing
      let basePricePerNight = 0;
      if (assignedRoom) basePricePerNight = Number(assignedRoom.pricePerNight || 0);
      else if (roomType) {
        const anyRoom = await Room.findOne({ where: { roomType: String(roomType) }, order: [['pricePerNight', 'ASC']], transaction: t });
        basePricePerNight = anyRoom ? Number(anyRoom.pricePerNight || 0) : 0;
      }

      const quote = calculatePricing({
        checkIn: ci,
        checkOut: co,
        guests: Number(numberOfGuests || 1),
        ratePlan,
        basePricePerNight,
        extras: extras || {},
      });

      const advancePaid = Number(payment?.advancePaid || 0) || 0;
      const balanceAmount = Math.max(0, Number(quote.total || 0) - advancePaid);

      // Create booking
      const booking = await Booking.create(
        {
          bookingNumber,
          guestId: String(guestRow.id),
          guestName,
          guestEmail: email || guestRow.email,
          guestPhone: phone || guestRow.phone,
          roomId: assignedRoom ? String(assignedRoom.id) : 'TBD',
          roomNumber: assignedRoom ? String(assignedRoom.roomNumber) : 'TBD',
          roomType: roomType || (assignedRoom ? assignedRoom.roomType : null),
          checkIn: ci,
          checkOut: co,
          numberOfGuests: Number(numberOfGuests || 1),
          totalAmount: quote.total,
          status: wantsConfirm ? 'confirmed' : 'pending',
          isTentative,
          ratePlan: ratePlan || 'standard',
          pricingBreakdown: quote.breakdown || {},
          extras: extras || {},
          roomCostTotal: quote.roomCost,
          extrasCostTotal: quote.extrasCost,
          advancePaid,
          balanceAmount,
          paymentMode: payment?.mode || payment?.paymentMode || null,
          specialRequests: specialRequests || null,
        },
        { transaction: t }
      );

      let paymentRow = null;
      if (advancePaid > 0) {
        paymentRow = await Payment.create(
          {
            bookingId: String(booking.id),
            amount: advancePaid,
            currency: 'USD',
            paymentMethod: normalizePaymentMethod(payment?.mode || payment?.paymentMode),
            status: 'completed',
            transactionId: `ADV-${Date.now()}`,
            guestId: String(guestRow.id),
            guestName,
            notes: payment?.mode ? `Mode: ${payment.mode}` : null,
          },
          { transaction: t }
        );
      }

      return { booking, payment: paymentRow };
    });

    if (result && result.error) {
      return res.status(result.error.status || 400).json({ message: result.error.message });
    }

    res.status(201).json({
      booking: result.booking,
      payment: result.payment,
    });
  } catch (error) {
    console.error('createReservation error:', error);
    res.status(500).json({ message: 'Failed to create reservation', error: error.message });
  }
}

async function collectAdvance(req, res) {
  const { bookingId } = req.params;
  const { amount, mode } = req.body || {};

  try {
    const { Booking, Payment } = req.hotelModels;

    const booking = await Booking.findByPk(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const amt = Number(amount || 0) || 0;
    if (amt <= 0) return res.status(400).json({ message: 'Amount must be > 0' });

    const newAdvance = Number(booking.advancePaid || 0) + amt;
    const total = Number(booking.totalAmount || 0);
    const balanceAmount = Math.max(0, total - newAdvance);

    const payment = await Payment.create({
      bookingId: String(booking.id),
      amount: amt,
      currency: 'USD',
      paymentMethod: normalizePaymentMethod(mode),
      status: 'completed',
      transactionId: `ADV-${Date.now()}`,
      guestId: String(booking.guestId),
      guestName: String(booking.guestName),
      notes: mode ? `Mode: ${mode}` : null,
    });

    await booking.update({
      advancePaid: newAdvance,
      balanceAmount,
      paymentMode: mode || booking.paymentMode || null,
    });

    res.json({ booking, payment });
  } catch (error) {
    console.error('collectAdvance error:', error);
    res.status(500).json({ message: 'Failed to collect advance' });
  }
}

async function listReservations(req, res) {
  try {
    const { Booking } = req.hotelModels;
    const { status, checkInFrom, checkInTo, search, roomType } = req.query || {};

    const where = {};

    if (status) {
      if (status === 'no_show') {
        where.status = 'cancelled';
        where.isNoShow = true;
      } else {
        where.status = normalizeStatus(status) || undefined;
      }
    }

    if (roomType) {
      where.roomType = String(roomType);
    }

    if (checkInFrom || checkInTo) {
      where.checkIn = {};
      if (checkInFrom) where.checkIn[sequelize.Op.gte] = asDate(checkInFrom);
      if (checkInTo) where.checkIn[sequelize.Op.lte] = asDate(checkInTo);
    }

    if (search) {
      const s = String(search).trim();
      if (s) {
        where[sequelize.Op.or] = [
          { bookingNumber: { [sequelize.Op.iLike]: `%${s}%` } },
          { guestName: { [sequelize.Op.iLike]: `%${s}%` } },
          { guestPhone: { [sequelize.Op.iLike]: `%${s}%` } },
        ];
      }
    }

    const rows = await Booking.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    res.json({ reservations: rows });
  } catch (error) {
    console.error('listReservations error:', error);
    res.status(500).json({ message: 'Failed to load reservations' });
  }
}

async function getReservation(req, res) {
  try {
    const { Booking } = req.hotelModels;
    const { bookingId } = req.params;
    const row = await Booking.findByPk(bookingId);
    if (!row) return res.status(404).json({ message: 'Reservation not found' });
    res.json({ reservation: row });
  } catch (error) {
    console.error('getReservation error:', error);
    res.status(500).json({ message: 'Failed to load reservation' });
  }
}

async function updateReservation(req, res) {
  const { bookingId } = req.params;
  const {
    checkIn,
    checkOut,
    roomType,
    roomId,
    ratePlan,
    extras,
    specialRequests,
    guest,
    status,
  } = req.body || {};

  try {
    const { Booking, Room, Guest } = req.hotelModels;
    const booking = await Booking.findByPk(bookingId);
    if (!booking) return res.status(404).json({ message: 'Reservation not found' });

    const updates = {};

    let ci = booking.checkIn;
    let co = booking.checkOut;
    if (checkIn) ci = asDate(checkIn) || ci;
    if (checkOut) co = asDate(checkOut) || co;

    const datesChanged =
      ci.getTime() !== booking.checkIn.getTime() || co.getTime() !== booking.checkOut.getTime();

    const roomTypeFinal = roomType || booking.roomType;
    const roomIdFinal = roomId || booking.roomId;

    if (datesChanged || roomType || roomId) {
      const { availableRooms } = await getAvailableRooms({
        Room,
        Booking,
        checkIn: ci,
        checkOut: co,
        roomType: roomTypeFinal,
        excludeBookingId: booking.id,
      });

      let assignedRoom = null;
      if (roomIdFinal) {
        assignedRoom = availableRooms.find((r) => String(r.id) === String(roomIdFinal));
        if (!assignedRoom) {
          return res
            .status(409)
            .json({ message: 'Selected room is not available for the new dates' });
        }
      } else if (!booking.isTentative) {
        assignedRoom = availableRooms.find(
          (r) => String(r.id) === String(booking.roomId)
        ) || availableRooms[0];
        if (!assignedRoom) {
          return res
            .status(409)
            .json({ message: 'No rooms available for selected dates and room type' });
        }
      }

      let basePricePerNight = 0;
      if (assignedRoom) {
        basePricePerNight = Number(assignedRoom.pricePerNight || 0);
        updates.roomId = String(assignedRoom.id);
        updates.roomNumber = String(assignedRoom.roomNumber);
        updates.roomType = assignedRoom.roomType;
      } else if (roomTypeFinal) {
        const anyRoom = await Room.findOne({
          where: { roomType: String(roomTypeFinal) },
          order: [['pricePerNight', 'ASC']],
        });
        basePricePerNight = anyRoom ? Number(anyRoom.pricePerNight || 0) : 0;
        updates.roomType = roomTypeFinal;
      }

      const quote = calculatePricing({
        checkIn: ci,
        checkOut: co,
        guests: Number(booking.numberOfGuests || 1),
        ratePlan: ratePlan || booking.ratePlan,
        extras: extras || booking.extras || {},
        basePricePerNight,
      });

      updates.checkIn = ci;
      updates.checkOut = co;
      updates.totalAmount = quote.total;
      updates.roomCostTotal = quote.roomCost;
      updates.extrasCostTotal = quote.extrasCost;
      updates.pricingBreakdown = quote.breakdown;
      updates.extras = extras || booking.extras || {};
    }

    if (ratePlan) updates.ratePlan = ratePlan;
    if (typeof specialRequests !== 'undefined') updates.specialRequests = specialRequests;

    if (guest) {
      const email = String(guest.email || booking.guestEmail || '').trim();
      const phone = String(guest.phone || booking.guestPhone || '').trim();
      const firstName = String(guest.firstName || '').trim();
      const lastName = String(guest.lastName || '').trim();
      const displayName = fullGuestName({
        firstName: firstName || booking.guestName.split(' ')[0],
        lastName: lastName || booking.guestName.split(' ').slice(1).join(' '),
      });

      updates.guestName = displayName;
      updates.guestEmail = email || booking.guestEmail;
      updates.guestPhone = phone || booking.guestPhone;

      if (booking.guestId) {
        const guestRow = await Guest.findByPk(booking.guestId).catch(() => null);
        if (guestRow) {
          await guestRow.update({
            firstName: firstName || guestRow.firstName,
            lastName: lastName || guestRow.lastName,
            email: email || guestRow.email,
            phone: phone || guestRow.phone,
          });
        }
      }
    }

    if (status) {
      const next = normalizeStatus(status);
      if (!next) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      if (!canTransition(booking.status, next)) {
        return res.status(400).json({ message: 'Status transition not allowed' });
      }
      updates.status = next;
    }

    await booking.update(updates);
    res.json({ reservation: booking });
  } catch (error) {
    console.error('updateReservation error:', error);
    res.status(500).json({ message: 'Failed to update reservation' });
  }
}

async function cancelReservation(req, res) {
  const { bookingId } = req.params;
  const { reason, markNoShow } = req.body || {};

  try {
    const { Booking } = req.hotelModels;
    const booking = await Booking.findByPk(bookingId);
    if (!booking) return res.status(404).json({ message: 'Reservation not found' });

    if (!canTransition(booking.status, 'cancelled')) {
      return res.status(400).json({ message: 'Cannot cancel reservation in current status' });
    }

    await booking.update({
      status: 'cancelled',
      cancelReason: reason || null,
      cancelledAt: new Date(),
      isNoShow: Boolean(markNoShow),
    });

    res.json({ reservation: booking });
  } catch (error) {
    console.error('cancelReservation error:', error);
    res.status(500).json({ message: 'Failed to cancel reservation' });
  }
}

module.exports = {
  nextReservationNumber,
  checkAvailability,
  pricingQuote,
  createReservation,
  collectAdvance,
  listReservations,
  getReservation,
  updateReservation,
  cancelReservation,
};

