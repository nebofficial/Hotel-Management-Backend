const { computeOverviewKpis } = require('../utils/kpiCalculator');
const { buildRevenueTrend, buildOccupancyTrend } = require('../utils/trendAnalyticsService');

exports.getOverviewKpis = async (req, res) => {
  try {
    const { RoomBill, Room, Booking } = req.hotelModels;
    const period = req.query.period || 'today';
    const { startDate, endDate } = req.query;

    const summary = await computeOverviewKpis({
      RoomBill,
      Room,
      Booking,
      period,
      startDate,
      endDate,
    });

    res.json({
      period: summary.period,
      rangeStart: summary.rangeStart,
      rangeEnd: summary.rangeEnd,
      revenueKpi: summary.revenue,
      occupancyKpi: summary.occupancy,
      availableRoomsKpi: {
        totalAvailable: summary.occupancy.availableRooms,
        booked: summary.occupancy.occupiedRooms,
        maintenance: summary.occupancy.maintenanceRooms,
      },
      checkinsTodayKpi: {
        count: summary.checkinsToday,
      },
    });
  } catch (error) {
    console.error('overview.getOverviewKpis error:', error);
    res.status(500).json({ message: 'Failed to load overview KPIs', error: error.message });
  }
};

exports.getRevenueTrend = async (req, res) => {
  try {
    const { RoomBill } = req.hotelModels;
    const period = req.query.period || 'weekly';
    const { startDate, endDate } = req.query;

    const data = await buildRevenueTrend({ RoomBill, period, startDate, endDate });
    res.json(data);
  } catch (error) {
    console.error('overview.getRevenueTrend error:', error);
    res.status(500).json({ message: 'Failed to load revenue trend', error: error.message });
  }
};

exports.getOccupancyTrend = async (req, res) => {
  try {
    const { Room } = req.hotelModels;
    const period = req.query.period || 'weekly';
    const { startDate, endDate } = req.query;

    const data = await buildOccupancyTrend({ Room, period, startDate, endDate });
    res.json(data);
  } catch (error) {
    console.error('overview.getOccupancyTrend error:', error);
    res.status(500).json({ message: 'Failed to load occupancy trend', error: error.message });
  }
};

