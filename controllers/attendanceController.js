const { Op } = require('sequelize');
const { calculateAttendanceRate } = require('../utils/attendanceCalculator');
const { buildAttendanceReport } = require('../utils/attendanceReportService');

function parseTimeToMinutes(t) {
  if (!t) return null;
  const [h, m] = String(t).split(':').map((x) => Number(x) || 0);
  return h * 60 + m;
}

function statusFromPayload(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'absent') return 'Absent';
  if (s === 'late') return 'Late';
  if (s === 'early exit' || s === 'early_checkout' || s === 'early') return 'Early Exit';
  return 'Present';
}

exports.markAttendance = async (req, res) => {
  try {
    const { Attendance } = req.hotelModels;
    await Attendance.sync({ alter: false });

    const {
      staffId,
      staffName,
      department,
      date,
      shift = 'Morning',
      status,
      checkInTime,
      checkOutTime,
    } = req.body || {};

    if (!staffId || !staffName || !date) {
      return res.status(400).json({ message: 'staffId, staffName and date are required' });
    }

    const normalizedStatus = statusFromPayload(status);
    const inMinutes = parseTimeToMinutes(checkInTime);
    const outMinutes = parseTimeToMinutes(checkOutTime);
    let workHours = null;
    if (inMinutes != null && outMinutes != null && outMinutes > inMinutes) {
      workHours = (outMinutes - inMinutes) / 60;
    }

    const existing = await Attendance.findOne({
      where: { staffId, date },
    });

    let record;
    if (existing) {
      record = await existing.update({
        staffName,
        department: department || existing.department,
        shift,
        status: normalizedStatus,
        checkInTime: checkInTime || existing.checkInTime,
        checkOutTime: checkOutTime || existing.checkOutTime,
        workHours: workHours != null ? workHours : existing.workHours,
      });
    } else {
      record = await Attendance.create({
        staffId,
        staffName,
        department: department || null,
        date,
        shift,
        status: normalizedStatus,
        checkInTime: checkInTime || null,
        checkOutTime: checkOutTime || null,
        workHours,
      });
    }

    res.status(201).json({ attendance: record.toJSON() });
  } catch (error) {
    console.error('markAttendance error:', error);
    res.status(500).json({ message: 'Failed to mark attendance', error: error.message });
  }
};

exports.fetchDailyAttendance = async (req, res) => {
  try {
    const { Attendance, StaffMember } = req.hotelModels;
    await Promise.all([
      Attendance.sync({ alter: false }),
      StaffMember.sync({ alter: false }),
    ]);

    const targetDate = req.query.date || new Date().toISOString().slice(0, 10);
    const where = { date: targetDate };
    if (req.query.department && req.query.department !== 'all') {
      where.department = req.query.department;
    }

    const records = await Attendance.findAll({
      where,
      order: [['staffName', 'ASC']],
    });

    const staffCount = await StaffMember.count({ where: { isActive: true } });
    // Map to objects compatible with attendanceCalculator (expects attendanceStatus)
    const calcRecords = records.map((r) => ({
      attendanceStatus: r.status === 'Early Exit' ? 'Present' : r.status,
    }));
    const metrics = calculateAttendanceRate(calcRecords);

    res.json({
      date: targetDate,
      summary: {
        totalStaff: staffCount,
        present: metrics.present,
        absent: metrics.absent,
        onLeave: metrics.onLeave,
        attendanceRate: metrics.rate,
      },
      list: records.map((r) => r.toJSON()),
    });
  } catch (error) {
    console.error('fetchDailyAttendance error:', error);
    res.status(500).json({ message: 'Failed to load attendance', error: error.message });
  }
};

exports.fetchAttendanceList = async (req, res) => {
  // For now, same as fetchDailyAttendance, with simple pagination
  try {
    const { Attendance } = req.hotelModels;
    await Attendance.sync({ alter: false });
    const targetDate = req.query.date || new Date().toISOString().slice(0, 10);
    const where = { date: targetDate };
    if (req.query.department && req.query.department !== 'all') {
      where.department = req.query.department;
    }

    const page = Number(req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 20);
    const offset = (page - 1) * pageSize;

    const { count, rows } = await Attendance.findAndCountAll({
      where,
      order: [['staffName', 'ASC']],
      offset,
      limit: pageSize,
    });

    res.json({
      date: targetDate,
      list: rows.map((r) => r.toJSON()),
      pagination: {
        page,
        pageSize,
        total: count,
      },
    });
  } catch (error) {
    console.error('fetchAttendanceList error:', error);
    res.status(500).json({ message: 'Failed to load attendance list', error: error.message });
  }
};

exports.fetchAttendanceCalendar = async (req, res) => {
  try {
    const { Attendance } = req.hotelModels;
    await Attendance.sync({ alter: false });

    const month = req.query.month; // format YYYY-MM
    if (!month) {
      return res.status(400).json({ message: 'month (YYYY-MM) is required' });
    }
    const from = `${month}-01`;
    const to = `${month}-31`;

    const rows = await Attendance.findAll({
      where: {
        date: {
          [Op.between]: [from, to],
        },
      },
    });

    const byDate = {};
    rows.forEach((r) => {
      const d = r.date;
      if (!byDate[d]) {
        byDate[d] = { date: d, present: 0, absent: 0, late: 0, earlyExit: 0 };
      }
      const bucket = byDate[d];
      if (r.status === 'Present') bucket.present += 1;
      else if (r.status === 'Absent') bucket.absent += 1;
      else if (r.status === 'Late') bucket.late += 1;
      else if (r.status === 'Early Exit') bucket.earlyExit += 1;
    });

    res.json({ days: Object.values(byDate) });
  } catch (error) {
    console.error('fetchAttendanceCalendar error:', error);
    res.status(500).json({ message: 'Failed to load attendance calendar', error: error.message });
  }
};

exports.generateAttendanceReport = async (req, res) => {
  try {
    const { Attendance } = req.hotelModels;
    await Attendance.sync({ alter: false });
    const report = await buildAttendanceReport(Attendance, req.body || {});
    res.json({ report });
  } catch (error) {
    console.error('generateAttendanceReport error:', error);
    res.status(500).json({ message: 'Failed to generate attendance report', error: error.message });
  }
};

exports.exportAttendance = async (req, res) => {
  try {
    // For now just return JSON; in future this could stream a file.
    const { Attendance } = req.hotelModels;
    await Attendance.sync({ alter: false });
    const report = await buildAttendanceReport(Attendance, req.body || {});
    res.json({
      report,
      export: {
        format: req.body?.format || 'pdf',
        // Frontend can render this JSON into PDF/Excel as needed.
      },
    });
  } catch (error) {
    console.error('exportAttendance error:', error);
    res.status(500).json({ message: 'Failed to export attendance', error: error.message });
  }
};

