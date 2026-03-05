const { sequelize } = require('../config/database');
const { asDate } = require('../utils/dateUtils');
const { getNextMasterGroupId } = require('../utils/masterGroupIdGenerator');
const { validateRoomBlocks } = require('../utils/roomBlockService');
const { calculateGroupPricing } = require('../utils/groupPricingService');

async function nextMasterGroupId(req, res) {
  try {
    const { GroupBooking } = req.hotelModels;
    const id = await getNextMasterGroupId(GroupBooking, new Date().getFullYear());
    res.json({ masterGroupId: id });
  } catch (error) {
    console.error('nextMasterGroupId error:', error);
    res.status(500).json({ message: 'Failed to generate master group ID' });
  }
}

async function blockRooms(req, res) {
  try {
    const { Room, Booking } = req.hotelModels;
    const { checkIn, checkOut, roomBlocks } = req.body || {};

    const ci = asDate(checkIn);
    const co = asDate(checkOut);
    if (!ci || !co) {
      return res.status(400).json({ message: 'Invalid check-in/check-out dates' });
    }

    const { ok, issues, availabilityByType } = await validateRoomBlocks({
      Room,
      Booking,
      checkIn: ci,
      checkOut: co,
      roomBlocks,
    });

    if (!ok) {
      return res.status(409).json({
        message: 'Insufficient room inventory for requested blocks',
        issues,
        availabilityByType,
      });
    }

    res.json({ ok: true, availabilityByType });
  } catch (error) {
    console.error('blockRooms error:', error);
    res.status(500).json({ message: 'Failed to validate room blocks' });
  }
}

async function applyGroupDiscount(req, res) {
  try {
    const { checkIn, checkOut, ratePerNight, totalRooms, discountPercent, discountFlat } =
      req.body || {};

    const ci = asDate(checkIn);
    const co = asDate(checkOut);
    if (!ci || !co) {
      return res.status(400).json({ message: 'Invalid check-in/check-out dates' });
    }

    const result = calculateGroupPricing({
      checkIn: ci,
      checkOut: co,
      ratePerNight,
      totalRooms,
      discountPercent,
      discountFlat,
    });

    res.json(result);
  } catch (error) {
    console.error('applyGroupDiscount error:', error);
    res.status(500).json({ message: 'Failed to calculate group pricing' });
  }
}

async function createGroupBooking(req, res) {
  const {
    masterGroupId: masterGroupIdInput,
    groupName,
    companyName,
    contactName,
    contactPhone,
    contactEmail,
    checkIn,
    checkOut,
    totalRoomsRequired,
    roomBlocks,
    guestList,
    ratePlan,
    discountPercent,
    discountFlat,
    billingMode,
    advancePaid,
    notes,
    confirm,
  } = req.body || {};

  const ci = asDate(checkIn);
  const co = asDate(checkOut);
  if (!ci || !co) return res.status(400).json({ message: 'Invalid check-in/check-out dates' });

  if (!groupName || !contactName || !contactPhone) {
    return res
      .status(400)
      .json({ message: 'Group name, contact name, and contact phone are required' });
  }

  try {
    const { GroupBooking, Room, Booking } = req.hotelModels;

    // Ensure group_bookings table exists (handles schemas created after startup)
    await GroupBooking.sync({ alter: false });

    const result = await sequelize.transaction(async (t) => {
      // Validate blocks
      const validateResult = await validateRoomBlocks({
        Room,
        Booking,
        checkIn: ci,
        checkOut: co,
        roomBlocks,
      });

      if (!validateResult.ok) {
        const msg =
          validateResult.issues?.length > 0
            ? validateResult.issues
                .map((i) => `${i.roomType}: requested ${i.requested}, available ${i.available}`)
                .join('; ')
            : 'Insufficient room inventory for requested blocks';
        return {
          error: {
            status: 409,
            payload: { ...validateResult, message: msg },
          },
        };
      }

      // Master group ID
      let masterGroupId = (masterGroupIdInput && String(masterGroupIdInput).trim()) || null;
      if (!masterGroupId) {
        masterGroupId = await getNextMasterGroupId(GroupBooking, new Date().getFullYear());
      }

      // Simple pricing model: use first block's ratePerNight as base
      const blocks = Array.isArray(roomBlocks) ? roomBlocks : [];
      const firstBlock = blocks.find((b) => Number(b.ratePerNight || 0) > 0);
      const ratePerNight = firstBlock ? Number(firstBlock.ratePerNight || 0) : 0;

      const totalRooms = Number(totalRoomsRequired || 0) || blocks.reduce((s, b) => s + Number(b.quantity || 0), 0);
      const pricing = calculateGroupPricing({
        checkIn: ci,
        checkOut: co,
        ratePerNight,
        totalRooms,
        discountPercent,
        discountFlat,
      });

      const adv = Number(advancePaid || 0) || 0;
      const balanceAmount = Math.max(0, pricing.finalAmount - adv);

      const status = confirm ? 'confirmed' : 'pending';

      const row = await GroupBooking.create(
        {
          masterGroupId,
          groupName,
          companyName: companyName || null,
          contactName,
          contactPhone,
          contactEmail: contactEmail || null,
          checkIn: ci,
          checkOut: co,
          totalRoomsRequired: totalRooms,
          roomBlocks: blocks,
          guestList: Array.isArray(guestList) ? guestList : [],
          baseAmount: pricing.baseAmount,
          discountAmount: pricing.discountAmount,
          finalAmount: pricing.finalAmount,
          advancePaid: adv,
          balanceAmount,
          billingMode: billingMode === 'split' ? 'split' : 'consolidated',
          ratePlan: ratePlan || null,
          discountPercent: discountPercent || null,
          discountFlat: discountFlat || null,
          status,
          notes: notes || null,
        },
        { transaction: t }
      );

      return { groupBooking: row };
    });

    if (result && result.error) {
      return res.status(result.error.status || 400).json(result.error.payload || { message: 'Validation failed' });
    }

    res.status(201).json({ groupBooking: result.groupBooking });
  } catch (error) {
    console.error('createGroupBooking error:', error);
    res.status(500).json({ message: 'Failed to create group booking', error: error.message });
  }
}

async function listGroupBookings(req, res) {
  try {
    const { GroupBooking } = req.hotelModels;
    const { status, checkInFrom, checkInTo, search } = req.query || {};

    const where = {};

    if (status) {
      where.status = status;
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
          { masterGroupId: { [sequelize.Op.iLike]: `%${s}%` } },
          { groupName: { [sequelize.Op.iLike]: `%${s}%` } },
          { companyName: { [sequelize.Op.iLike]: `%${s}%` } },
          { contactName: { [sequelize.Op.iLike]: `%${s}%` } },
        ];
      }
    }

    const rows = await GroupBooking.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    res.json({ groups: rows });
  } catch (error) {
    console.error('listGroupBookings error:', error);
    res.status(500).json({ message: 'Failed to load group bookings' });
  }
}

async function getGroupBooking(req, res) {
  try {
    const { GroupBooking } = req.hotelModels;
    const { groupId } = req.params;
    const row = await GroupBooking.findByPk(groupId);
    if (!row) return res.status(404).json({ message: 'Group booking not found' });
    res.json({ group: row });
  } catch (error) {
    console.error('getGroupBooking error:', error);
    res.status(500).json({ message: 'Failed to load group booking' });
  }
}

module.exports = {
  nextMasterGroupId,
  blockRooms,
  applyGroupDiscount,
  createGroupBooking,
  listGroupBookings,
  getGroupBooking,
};

