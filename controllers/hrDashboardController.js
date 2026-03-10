const {
  getStaffSummary,
  getDutyStatusToday,
  getPendingLeaveRequests,
  getStaffDistribution,
  getAttendanceTrend,
} = require('../utils/staffAnalyticsService');

function toJson(m) {
  return m && m.toJSON ? m.toJSON() : m;
}

exports.fetchStaffSummary = async (req, res) => {
  try {
    const { StaffMember, StaffSchedule, LeaveRequest } = req.hotelModels;
    await Promise.all([
      StaffMember.sync({ alter: false }),
      StaffSchedule.sync({ alter: false }),
      LeaveRequest.sync({ alter: false }),
    ]);
    const summary = await getStaffSummary({ StaffMember, StaffSchedule, LeaveRequest, today: new Date() });
    res.json({ summary });
  } catch (error) {
    console.error('HR fetchStaffSummary error:', error);
    res.status(500).json({ message: 'Failed to load staff summary', error: error.message });
  }
};

exports.fetchDutyStatus = async (req, res) => {
  try {
    const { StaffSchedule } = req.hotelModels;
    await StaffSchedule.sync({ alter: false });
    const list = await getDutyStatusToday({ StaffSchedule, today: new Date() });
    res.json({ list });
  } catch (error) {
    console.error('HR fetchDutyStatus error:', error);
    res.status(500).json({ message: 'Failed to load duty status', error: error.message });
  }
};

exports.fetchLeaveRequests = async (req, res) => {
  try {
    const { LeaveRequest } = req.hotelModels;
    await LeaveRequest.sync({ alter: false });
    const pending = await getPendingLeaveRequests({ LeaveRequest, limit: 20 });
    res.json({ pending: pending.map(toJson) });
  } catch (error) {
    console.error('HR fetchLeaveRequests error:', error);
    res.status(500).json({ message: 'Failed to load leave requests', error: error.message });
  }
};

exports.fetchAttendanceStats = async (req, res) => {
  try {
    const { StaffSchedule } = req.hotelModels;
    await StaffSchedule.sync({ alter: false });
    const today = new Date();
    const schedulesToday = await StaffSchedule.findAll({
      where: { date: today.toISOString().slice(0, 10) },
    });
    const { calculateAttendanceRate } = require('../utils/attendanceCalculator');
    const todayStats = calculateAttendanceRate(schedulesToday);
    const trend = await getAttendanceTrend({ StaffSchedule, days: 7, today });
    res.json({ today: todayStats, trend });
  } catch (error) {
    console.error('HR fetchAttendanceStats error:', error);
    res.status(500).json({ message: 'Failed to load attendance stats', error: error.message });
  }
};

exports.fetchStaffDistribution = async (req, res) => {
  try {
    const { StaffMember, Department } = req.hotelModels;
    await StaffMember.sync({ alter: false });
    try {
      await Department.sync({ alter: false });
    } catch {
      // Department table may not exist in schema
    }
    const departments = await getStaffDistribution({ StaffMember, Department });
    res.json({ departments });
  } catch (error) {
    console.error('HR fetchStaffDistribution error:', error);
    res.status(500).json({ message: 'Failed to load staff distribution', error: error.message });
  }
};

