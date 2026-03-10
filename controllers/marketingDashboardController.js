const { Op } = require('sequelize');
const {
  buildMarketingOverview,
  buildRoomCategoryRevenue,
  summarizeCampaigns,
  summarizeOtaChannels,
  buildRatePlanPerformance,
  buildRoomPricingOverview,
  buildDailyBookingTrend,
  buildRecentMarketingActivity,
} = require('../utils/marketingAnalyticsService');

function parseDateRange(req) {
  const start = req.query.startDate || null;
  const end = req.query.endDate || null;
  const endDate = end ? new Date(end) : new Date();
  const startDate = start
    ? new Date(start)
    : new Date(endDate.getTime() - 29 * 24 * 60 * 60 * 1000);
  return {
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10),
  };
}

function buildBookingWhere(startDate, endDate, extraFilters = {}) {
  const where = {
    status: { [Op.notIn]: ['cancelled'] },
    createdAt: {
      [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')],
    },
  };

  if (extraFilters.roomCategory) {
    where.roomType = extraFilters.roomCategory;
  }
  if (extraFilters.ratePlan) {
    where.ratePlan = extraFilters.ratePlan;
  }

  return where;
}

exports.getRoomPricingOverview = async (req, res) => {
  try {
    const { Room, Booking } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);
    const where = buildBookingWhere(startDate, endDate, {
      roomCategory: req.query.roomCategory,
      ratePlan: req.query.ratePlan,
    });

    const [rooms, bookings] = await Promise.all([
      Room.findAll(),
      Booking.findAll({ where }),
    ]);

    const overview = buildRoomPricingOverview(rooms, bookings);

    res.json({
      startDate,
      endDate,
      items: overview,
    });
  } catch (error) {
    console.error('getRoomPricingOverview error:', error);
    res
      .status(500)
      .json({ message: 'Failed to load room pricing overview', error: error.message });
  }
};

exports.getBookingPerformance = async (req, res) => {
  try {
    const { Booking } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);
    const where = buildBookingWhere(startDate, endDate, {
      roomCategory: req.query.roomCategory,
      ratePlan: req.query.ratePlan,
    });

    const bookings = await Booking.findAll({ where });
    const overview = buildMarketingOverview(bookings);
    const dailyTrend = buildDailyBookingTrend(bookings);

    res.json({
      startDate,
      endDate,
      summary: overview,
      dailyTrend,
    });
  } catch (error) {
    console.error('getBookingPerformance error:', error);
    res
      .status(500)
      .json({ message: 'Failed to load booking performance', error: error.message });
  }
};

exports.getCampaignSummary = async (req, res) => {
  try {
    const { Booking } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);
    const where = buildBookingWhere(startDate, endDate, {});

    const bookings = await Booking.findAll({ where });
    const campaigns = summarizeCampaigns(bookings);

    res.json({
      startDate,
      endDate,
      campaigns,
    });
  } catch (error) {
    console.error('getCampaignSummary error:', error);
    res
      .status(500)
      .json({ message: 'Failed to load campaign summary', error: error.message });
  }
};

exports.getOtaBookingInsights = async (req, res) => {
  try {
    const { Booking } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);
    const where = buildBookingWhere(startDate, endDate, {});

    const bookings = await Booking.findAll({ where });
    const channels = summarizeOtaChannels(bookings);

    res.json({
      startDate,
      endDate,
      channels,
    });
  } catch (error) {
    console.error('getOtaBookingInsights error:', error);
    res
      .status(500)
      .json({ message: 'Failed to load OTA booking insights', error: error.message });
  }
};

exports.getRatePlanPerformance = async (req, res) => {
  try {
    const { Booking } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);
    const where = buildBookingWhere(startDate, endDate, {
      roomCategory: req.query.roomCategory,
    });

    const bookings = await Booking.findAll({ where });
    const ratePlans = buildRatePlanPerformance(bookings);

    res.json({
      startDate,
      endDate,
      ratePlans,
    });
  } catch (error) {
    console.error('getRatePlanPerformance error:', error);
    res
      .status(500)
      .json({ message: 'Failed to load rate plan performance', error: error.message });
  }
};

exports.getRevenueByRoomCategory = async (req, res) => {
  try {
    const { Booking } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);
    const where = buildBookingWhere(startDate, endDate, {
      ratePlan: req.query.ratePlan,
    });

    const bookings = await Booking.findAll({ where });
    const byRoomCategory = buildRoomCategoryRevenue(bookings);

    res.json({
      startDate,
      endDate,
      byRoomCategory,
    });
  } catch (error) {
    console.error('getRevenueByRoomCategory error:', error);
    res
      .status(500)
      .json({ message: 'Failed to load revenue by room category', error: error.message });
  }
};

exports.getRecentMarketingActivities = async (req, res) => {
  try {
    const { Booking } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);
    const where = buildBookingWhere(startDate, endDate, {});

    const bookings = await Booking.findAll({ where });
    const items = buildRecentMarketingActivity(bookings, 20);

    res.json({
      startDate,
      endDate,
      items,
    });
  } catch (error) {
    console.error('getRecentMarketingActivities error:', error);
    res
      .status(500)
      .json({ message: 'Failed to load recent marketing activity', error: error.message });
  }
};

