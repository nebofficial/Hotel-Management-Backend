const { Op } = require('sequelize');
const { Hotel } = require('../models');
const getHotelModels = require('../utils/hotelModels');
const { getOccupancyRate } = require('../utils/occupancyCalculator');

function parseDateRange(req) {
  const start = req.query.startDate || null;
  const end = req.query.endDate || null;
  const endDate = end ? new Date(end) : new Date();
  const startDate = start
    ? new Date(start)
    : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  return {
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10),
  };
}

async function getAccessibleHotels(user) {
  if (user.role === 'super_admin') {
    const hotels = await Hotel.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'address', 'email', 'phone'],
      order: [['name', 'ASC']],
    });
    return hotels;
  }
  if (user.hotelId) {
    const hotel = await Hotel.findByPk(user.hotelId, {
      attributes: ['id', 'name', 'address', 'email', 'phone'],
    });
    return hotel ? [hotel] : [];
  }
  return [];
}

async function getPropertyMetrics(hotel, hotelModels) {
  try {
    const { Room, Booking, RoomBill, RestaurantBill, RoomServiceOrder } = hotelModels;
    const today = new Date().toISOString().slice(0, 10);

    const [rooms, activeBookings, roomBills, restBills, rsOrders] = await Promise.all([
      Room ? Room.findAll({ where: { status: { [Op.ne]: 'maintenance' } } }) : [],
      Booking
        ? Booking.findAll({
            where: {
              status: { [Op.in]: ['confirmed', 'checked_in'] },
              checkIn: { [Op.lte]: new Date(today + 'T23:59:59') },
              checkOut: { [Op.gte]: new Date(today) },
            },
          })
        : [],
      RoomBill
        ? RoomBill.findAll({
            where: {
              status: { [Op.in]: ['SETTLED', 'PENDING'] },
              createdAt: { [Op.gte]: new Date(today) },
            },
          })
        : [],
      RestaurantBill
        ? RestaurantBill.findAll({
            where: {
              status: { [Op.in]: ['Paid', 'On Hold'] },
              createdAt: { [Op.gte]: new Date(today) },
            },
          })
        : [],
      RoomServiceOrder
        ? RoomServiceOrder.findAll({
            where: {
              status: { [Op.ne]: 'Cancelled' },
              createdAt: { [Op.gte]: new Date(today) },
            },
          })
        : [],
    ]);

    const totalRooms = rooms?.length || 0;
    const occupied = activeBookings?.length || 0;
    const occupancyRate = getOccupancyRate(occupied, totalRooms);

    const roomRev = (roomBills || []).reduce((s, b) => s + parseFloat(b.grandTotal || 0), 0);
    const restRev =
      (restBills || []).reduce((s, b) => s + parseFloat(b.totalAmount || 0), 0) +
      (rsOrders || []).reduce((s, o) => s + parseFloat(o.totalAmount || 0), 0);
    const revenueToday = roomRev + restRev;

    return {
      hotelId: hotel.id,
      hotelName: hotel.name,
      totalRooms,
      occupied,
      occupancyRate,
      revenueToday,
      activeBookings: occupied,
    };
  } catch (err) {
    console.error(`getPropertyMetrics error for ${hotel.name}:`, err.message);
    return {
      hotelId: hotel.id,
      hotelName: hotel.name,
      totalRooms: 0,
      occupied: 0,
      occupancyRate: 0,
      revenueToday: 0,
      activeBookings: 0,
    };
  }
}

async function getPropertyRevenueInRange(hotel, hotelModels, startDate, endDate) {
  try {
    const { RoomBill, RestaurantBill, RoomServiceOrder } = hotelModels;
    const dateFilter = {
      createdAt: {
        [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')],
      },
    };

    const [roomBills, restBills, rsOrders] = await Promise.all([
      RoomBill
        ? RoomBill.findAll({
            where: {
              status: { [Op.in]: ['SETTLED', 'PENDING'] },
              ...dateFilter,
            },
          })
        : [],
      RestaurantBill
        ? RestaurantBill.findAll({
            where: {
              status: { [Op.in]: ['Paid', 'On Hold'] },
              ...dateFilter,
            },
          })
        : [],
      RoomServiceOrder
        ? RoomServiceOrder.findAll({
            where: { status: { [Op.ne]: 'Cancelled' }, ...dateFilter },
          })
        : [],
    ]);

    const roomRev = (roomBills || []).reduce((s, b) => s + parseFloat(b.grandTotal || 0), 0);
    const restRev =
      (restBills || []).reduce((s, b) => s + parseFloat(b.totalAmount || 0), 0) +
      (rsOrders || []).reduce((s, o) => s + parseFloat(o.totalAmount || 0), 0);
    return roomRev + restRev;
  } catch (err) {
    return 0;
  }
}

exports.getPropertyStats = async (req, res) => {
  try {
    const hotels = await getAccessibleHotels(req.user);
    let totalProperties = hotels.length;
    let totalRooms = 0;
    let totalActiveBookings = 0;
    let totalRevenueToday = 0;

    for (const hotel of hotels) {
      try {
        const models = getHotelModels(hotel.name);
        const m = await getPropertyMetrics(hotel, models);
        totalRooms += m.totalRooms;
        totalActiveBookings += m.activeBookings;
        totalRevenueToday += m.revenueToday;
      } catch {
        // Schema may not exist
      }
    }

    const overallOccupancy =
      totalRooms > 0 ? getOccupancyRate(totalActiveBookings, totalRooms) : 0;

    res.json({
      totalProperties,
      totalRooms,
      totalActiveBookings,
      overallOccupancyRate: overallOccupancy,
      totalRevenueToday,
    });
  } catch (error) {
    console.error('getPropertyStats error:', error);
    res.status(500).json({ message: 'Failed to load property stats', error: error.message });
  }
};

exports.getOccupancyAcrossProperties = async (req, res) => {
  try {
    const hotels = await getAccessibleHotels(req.user);
    const results = [];

    for (const hotel of hotels) {
      try {
        const models = getHotelModels(hotel.name);
        const m = await getPropertyMetrics(hotel, models);
        results.push({
          hotelId: m.hotelId,
          hotelName: m.hotelName,
          totalRooms: m.totalRooms,
          occupied: m.occupied,
          occupancyRate: m.occupancyRate,
        });
      } catch {
        results.push({
          hotelId: hotel.id,
          hotelName: hotel.name,
          totalRooms: 0,
          occupied: 0,
          occupancyRate: 0,
        });
      }
    }

    res.json({ properties: results });
  } catch (error) {
    console.error('getOccupancyAcrossProperties error:', error);
    res.status(500).json({
      message: 'Failed to load occupancy',
      error: error.message,
    });
  }
};

exports.getTotalRevenue = async (req, res) => {
  try {
    const { startDate, endDate } = parseDateRange(req);
    const hotels = await getAccessibleHotels(req.user);

    let totalRevenue = 0;
    const byProperty = [];

    for (const hotel of hotels) {
      try {
        const models = getHotelModels(hotel.name);
        const rev = await getPropertyRevenueInRange(hotel, models, startDate, endDate);
        totalRevenue += rev;
        byProperty.push({ hotelId: hotel.id, hotelName: hotel.name, revenue: rev });
      } catch {
        byProperty.push({ hotelId: hotel.id, hotelName: hotel.name, revenue: 0 });
      }
    }

    const today = new Date().toISOString().slice(0, 10);
    let revenueToday = 0;
    for (const hotel of hotels) {
      try {
        const models = getHotelModels(hotel.name);
        const m = await getPropertyMetrics(hotel, models);
        revenueToday += m.revenueToday;
      } catch {
        // skip
      }
    }

    const avgRevenuePerProperty =
      hotels.length > 0 ? totalRevenue / hotels.length : 0;

    res.json({
      totalRevenue,
      revenueToday,
      averageRevenuePerProperty: avgRevenuePerProperty,
      byProperty,
      startDate,
      endDate,
    });
  } catch (error) {
    console.error('getTotalRevenue error:', error);
    res.status(500).json({ message: 'Failed to load total revenue', error: error.message });
  }
};

exports.getPropertyComparison = async (req, res) => {
  try {
    const { startDate, endDate } = parseDateRange(req);
    const hotels = await getAccessibleHotels(req.user);
    const today = new Date().toISOString().slice(0, 10);

    const results = [];

    for (const hotel of hotels) {
      try {
        const models = getHotelModels(hotel.name);
        const m = await getPropertyMetrics(hotel, models);
        const rev = await getPropertyRevenueInRange(hotel, models, startDate, endDate);

        const daysInRange =
          Math.max(1, (new Date(endDate) - new Date(startDate)) / (24 * 60 * 60 * 1000)) + 1;
        const roomNights = m.totalRooms * daysInRange;
        const adr = m.occupied > 0 ? rev / m.occupied : 0;
        const revpar = m.totalRooms > 0 ? rev / m.totalRooms : 0;

        results.push({
          hotelId: m.hotelId,
          hotelName: m.hotelName,
          occupancyRate: m.occupancyRate,
          revenue: rev,
          averageDailyRate: adr,
          revPAR: revpar,
          totalRooms: m.totalRooms,
          occupied: m.occupied,
        });
      } catch {
        results.push({
          hotelId: hotel.id,
          hotelName: hotel.name,
          occupancyRate: 0,
          revenue: 0,
          averageDailyRate: 0,
          revPAR: 0,
          totalRooms: 0,
          occupied: 0,
        });
      }
    }

    res.json({ properties: results, startDate, endDate });
  } catch (error) {
    console.error('getPropertyComparison error:', error);
    res.status(500).json({
      message: 'Failed to load property comparison',
      error: error.message,
    });
  }
};

exports.getRevenueDistribution = async (req, res) => {
  try {
    const { startDate, endDate } = parseDateRange(req);
    const hotels = await getAccessibleHotels(req.user);

    const byProperty = [];
    let totalRevenue = 0;

    for (const hotel of hotels) {
      try {
        const models = getHotelModels(hotel.name);
        const rev = await getPropertyRevenueInRange(hotel, models, startDate, endDate);
        totalRevenue += rev;
        byProperty.push({ name: hotel.name, value: rev, hotelId: hotel.id });
      } catch {
        byProperty.push({ name: hotel.name, value: 0, hotelId: hotel.id });
      }
    }

    const withShare = byProperty.map((p) => ({
      ...p,
      share: totalRevenue > 0 ? (p.value / totalRevenue) * 100 : 0,
    }));

    res.json({
      byProperty: withShare,
      totalRevenue,
      startDate,
      endDate,
    });
  } catch (error) {
    console.error('getRevenueDistribution error:', error);
    res.status(500).json({
      message: 'Failed to load revenue distribution',
      error: error.message,
    });
  }
};

exports.getRecentPropertyActivity = async (req, res) => {
  try {
    const hotels = await getAccessibleHotels(req.user);
    const activities = [];
    const limit = parseInt(req.query.limit || '10', 10);

    for (const hotel of hotels) {
      try {
        const models = getHotelModels(hotel.name);
        const { Booking, RoomBill } = models;
        if (!Booking && !RoomBill) continue;

        const recent = [];
        if (Booking) {
          const bookings = await Booking.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'guestName', 'checkIn', 'checkOut', 'status', 'createdAt'],
          });
          bookings.forEach((b) => {
            recent.push({
              type: 'booking',
              propertyName: hotel.name,
              propertyId: hotel.id,
              message: `New booking for ${b.guestName || 'Guest'} - ${b.status}`,
              createdAt: b.createdAt,
            });
          });
        }
        if (RoomBill) {
          const bills = await RoomBill.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'grandTotal', 'status', 'createdAt'],
          });
          bills.forEach((b) => {
            recent.push({
              type: 'revenue',
              propertyName: hotel.name,
              propertyId: hotel.id,
              message: `Bill settled: $${parseFloat(b.grandTotal || 0).toFixed(2)}`,
              createdAt: b.createdAt,
            });
          });
        }
        activities.push(...recent);
      } catch {
        // Skip hotel
      }
    }

    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const trimmed = activities.slice(0, limit);

    res.json({ activities: trimmed });
  } catch (error) {
    console.error('getRecentPropertyActivity error:', error);
    res.status(500).json({
      message: 'Failed to load recent activity',
      error: error.message,
    });
  }
};

async function getBookingCountInRange(hotel, hotelModels, startDate, endDate) {
  try {
    const { Booking } = hotelModels;
    if (!Booking) return 0;
    const count = await Booking.count({
      where: {
        status: { [Op.in]: ['confirmed', 'checked_in'] },
        [Op.or]: [
          {
            checkIn: { [Op.lte]: new Date(endDate + 'T23:59:59') },
            checkOut: { [Op.gte]: new Date(startDate) },
          },
        ],
      },
    });
    return count;
  } catch (err) {
    return 0;
  }
}

exports.getTotalBookings = async (req, res) => {
  try {
    const { startDate, endDate } = parseDateRange(req);
    const hotels = await getAccessibleHotels(req.user);
    let totalBookings = 0;
    const byProperty = [];

    for (const hotel of hotels) {
      try {
        const models = getHotelModels(hotel.name);
        const count = await getBookingCountInRange(hotel, models, startDate, endDate);
        totalBookings += count;
        byProperty.push({ hotelId: hotel.id, hotelName: hotel.name, bookings: count });
      } catch {
        byProperty.push({ hotelId: hotel.id, hotelName: hotel.name, bookings: 0 });
      }
    }

    res.json({ totalBookings, byProperty, startDate, endDate });
  } catch (error) {
    console.error('getTotalBookings error:', error);
    res.status(500).json({ message: 'Failed to load total bookings', error: error.message });
  }
};

async function getMonthlyData(hotel, hotelModels, year, month) {
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
  try {
    const rev = await getPropertyRevenueInRange(hotel, hotelModels, monthStart, monthEnd);
    const bookings = await getBookingCountInRange(hotel, hotelModels, monthStart, monthEnd);
    const { Room } = hotelModels;
    const rooms = Room ? await Room.count({ where: { status: { [Op.ne]: 'maintenance' } } }) : 0;
    const days = lastDay;
    const roomNights = rooms * days;
    const occupancy = roomNights > 0 ? getOccupancyRate(bookings, roomNights) : 0;
    return { revenue: rev, bookings, occupancy };
  } catch {
    return { revenue: 0, bookings: 0, occupancy: 0 };
  }
}

exports.getMonthlyTrends = async (req, res) => {
  try {
    const months = parseInt(req.query.months || '6', 10);
    const hotels = await getAccessibleHotels(req.user);
    const now = new Date();
    const trends = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const monthLabel = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      let totalRevenue = 0;
      let totalBookings = 0;
      let avgOccupancy = 0;
      let propCount = 0;

      for (const hotel of hotels) {
        try {
          const models = getHotelModels(hotel.name);
          const data = await getMonthlyData(hotel, models, year, month);
          totalRevenue += data.revenue;
          totalBookings += data.bookings;
          avgOccupancy += data.occupancy;
          propCount += 1;
        } catch {
          // skip
        }
      }

      trends.push({
        month: monthLabel,
        year,
        monthNum: month,
        totalRevenue,
        totalBookings,
        averageOccupancy: propCount > 0 ? avgOccupancy / propCount : 0,
      });
    }

    res.json({ trends });
  } catch (error) {
    console.error('getMonthlyTrends error:', error);
    res.status(500).json({ message: 'Failed to load monthly trends', error: error.message });
  }
};

exports.getPropertiesList = async (req, res) => {
  try {
    const hotels = await getAccessibleHotels(req.user);
    const enriched = [];

    for (const hotel of hotels) {
      try {
        const models = getHotelModels(hotel.name);
        const m = await getPropertyMetrics(hotel, models);
        enriched.push({
          id: hotel.id,
          name: hotel.name,
          address: hotel.address || '',
          city: (hotel.address || '').split(',')[0] || '—',
          rooms: m.totalRooms,
          occupancy: `${m.occupancyRate}%`,
          status: hotel.isActive ? 'Active' : 'Inactive',
          isActive: hotel.isActive,
        });
      } catch {
        enriched.push({
          id: hotel.id,
          name: hotel.name,
          address: hotel.address || '',
          city: (hotel.address || '').split(',')[0] || '—',
          rooms: 0,
          occupancy: '0%',
          status: hotel.isActive ? 'Active' : 'Inactive',
          isActive: hotel.isActive,
        });
      }
    }

    res.json({ properties: enriched });
  } catch (error) {
    console.error('getPropertiesList error:', error);
    res.status(500).json({ message: 'Failed to load properties', error: error.message });
  }
};
