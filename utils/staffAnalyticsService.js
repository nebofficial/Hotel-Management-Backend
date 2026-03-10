const { Op } = require('sequelize');
const { calculateAttendanceRate } = require('./attendanceCalculator');

async function getTodaySchedules(StaffSchedule, date) {
  const todayStr = date.toISOString().slice(0, 10);
  return StaffSchedule.findAll({
    where: { date: todayStr },
    order: [['staffName', 'ASC']],
  });
}

async function getStaffSummary({ StaffMember, StaffSchedule, LeaveRequest, today = new Date() }) {
  const [totalStaff, schedules] = await Promise.all([
    StaffMember.count({ where: { isActive: true } }),
    getTodaySchedules(StaffSchedule, today),
  ]);

  const attendance = calculateAttendanceRate(schedules);

  const todayStr = today.toISOString().slice(0, 10);
  const onLeaveToday = await LeaveRequest.count({
    where: {
      status: 'Approved',
      startDate: { [Op.lte]: todayStr },
      endDate: { [Op.gte]: todayStr },
    },
  });

  return {
    totalStaff,
    onDutyToday: attendance.present,
    onLeaveToday,
    attendanceRate: attendance.rate,
  };
}

async function getDutyStatusToday({ StaffSchedule, today = new Date() }) {
  const schedules = await getTodaySchedules(StaffSchedule, today);
  return schedules.map((s) => ({
    id: s.id,
    staffName: s.staffName,
    department: s.department || s.role,
    shift: s.shift,
    status: s.attendanceStatus,
  }));
}

async function getPendingLeaveRequests({ LeaveRequest, limit = 10 }) {
  const pending = await LeaveRequest.findAll({
    where: { status: 'Pending' },
    order: [['createdAt', 'DESC']],
    limit,
  });
  return pending;
}

async function getStaffDistribution({ StaffMember, Department }) {
  const staff = await StaffMember.findAll({ where: { isActive: true } });
  const counts = {};
  staff.forEach((s) => {
    const key = s.department || 'Unassigned';
    counts[key] = (counts[key] || 0) + 1;
  });
  try {
    if (Department) {
      const departments = await Department.findAll({ where: { isActive: true } });
      departments.forEach((d) => {
        if (d.name && !Object.prototype.hasOwnProperty.call(counts, d.name)) {
          counts[d.name] = 0;
        }
      });
    }
  } catch {
    // Department table may not exist; use staff-based counts only
  }
  return Object.entries(counts).map(([name, count]) => ({ name, count }));
}

async function getAttendanceTrend({ StaffSchedule, days = 7, today = new Date() }) {
  const trend = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const schedules = await getTodaySchedules(StaffSchedule, d);
    const attendance = calculateAttendanceRate(schedules);
    trend.push({
      date: d.toISOString().slice(0, 10),
      rate: attendance.rate,
    });
  }
  return trend;
}

module.exports = {
  getStaffSummary,
  getDutyStatusToday,
  getPendingLeaveRequests,
  getStaffDistribution,
  getAttendanceTrend,
};

