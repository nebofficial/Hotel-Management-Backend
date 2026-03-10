const { Op } = require('sequelize');

function parseDate(input) {
  if (!input) return null;
  return new Date(input);
}

async function getRangeRecords(Attendance, { from, to, staffId, department }) {
  const where = {};
  if (from || to) {
    where.date = {};
    if (from) where.date[Op.gte] = from;
    if (to) where.date[Op.lte] = to;
  }
  if (staffId) where.staffId = staffId;
  if (department) where.department = department;
  const rows = await Attendance.findAll({ where, order: [['date', 'ASC'], ['staffName', 'ASC']] });
  return rows;
}

function summarize(records) {
  let totalDays = 0;
  let present = 0;
  let absent = 0;
  let late = 0;
  let earlyExit = 0;
  const byStaff = {};

  records.forEach((r) => {
    totalDays += 1;
    const status = r.status || 'Present';
    if (status === 'Present') present += 1;
    else if (status === 'Absent') absent += 1;
    else if (status === 'Late') late += 1;
    else if (status === 'Early Exit') earlyExit += 1;

    const key = r.staffId || r.staffName;
    if (!byStaff[key]) {
      byStaff[key] = {
        staffId: r.staffId,
        staffName: r.staffName,
        department: r.department,
        days: 0,
        present: 0,
        absent: 0,
        late: 0,
        earlyExit: 0,
      };
    }
    const s = byStaff[key];
    s.days += 1;
    if (status === 'Present') s.present += 1;
    else if (status === 'Absent') s.absent += 1;
    else if (status === 'Late') s.late += 1;
    else if (status === 'Early Exit') s.earlyExit += 1;
  });

  const rate = totalDays ? (present / totalDays) * 100 : 0;

  return {
    summary: {
      totalDays,
      present,
      absent,
      late,
      earlyExit,
      attendanceRate: rate,
    },
    byStaff: Object.values(byStaff),
  };
}

async function buildAttendanceReport(Attendance, params) {
  const from = params.from || params.startDate;
  const to = params.to || params.endDate;
  const records = await getRangeRecords(Attendance, {
    from,
    to,
    staffId: params.staffId,
    department: params.department,
  });
  const { summary, byStaff } = summarize(records);
  return {
    range: { from, to },
    summary,
    byStaff,
  };
}

module.exports = {
  buildAttendanceReport,
};

