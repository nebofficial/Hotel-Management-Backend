const { Op } = require('sequelize');

function parseDateRange(req) {
  const start = req.query.startDate || null;
  const end = req.query.endDate || null;
  const endDate = end ? new Date(end) : new Date();
  const startDate = start ? new Date(start) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  return {
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10),
  };
}

exports.getAttendancePerformance = async (req, res) => {
  try {
    const { Attendance } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);
    const department = req.query.department || null;
    const staffId = req.query.staffId || null;

    const where = {
      date: { [Op.between]: [startDate, endDate] },
    };
    if (department) where.department = department;
    if (staffId) where.staffId = staffId;

    const rows = await Attendance.findAll({
      where,
      order: [['staffName', 'ASC'], ['date', 'ASC']],
    });

    const byStaff = {};
    rows.forEach((r) => {
      const key = r.staffId || r.staffName;
      if (!byStaff[key]) {
        byStaff[key] = {
          staffId: r.staffId,
          staffName: r.staffName,
          department: r.department,
          days: 0,
          presents: 0,
          lates: 0,
          absences: 0,
        };
      }
      byStaff[key].days += 1;
      if (r.status === 'Absent') {
        byStaff[key].absences += 1;
      } else {
        byStaff[key].presents += 1;
        if (r.status === 'Late') byStaff[key].lates += 1;
      }
    });

    const attendance = Object.values(byStaff).map((s) => ({
      staffId: s.staffId,
      staffName: s.staffName,
      department: s.department,
      attendancePercentage: s.days > 0 ? (s.presents / s.days) * 100 : 0,
      lateArrivals: s.lates,
      absences: s.absences,
    }));

    res.json({ attendance, startDate, endDate });
  } catch (error) {
    console.error('getAttendancePerformance error:', error);
    res.status(500).json({ message: 'Failed to load attendance performance', error: error.message });
  }
};

exports.getTaskCompletion = async (req, res) => {
  try {
    const { HousekeepingTask, LaundryTask } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);

    const dateFilter = {
      createdAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')] },
    };

    const [hkTasks, laundryTasks] = await Promise.all([
      HousekeepingTask
        ? HousekeepingTask.findAll({ where: dateFilter })
        : [],
      LaundryTask
        ? LaundryTask.findAll({ where: { ...dateFilter, assignedType: 'Staff' } })
        : [],
    ]);

    const byStaff = {};

    hkTasks.forEach((t) => {
      const name = t.housekeeper || 'Unknown';
      if (!byStaff[name]) byStaff[name] = { staffName: name, assigned: 0, completed: 0 };
      byStaff[name].assigned += 1;
      if (t.status === 'Completed') byStaff[name].completed += 1;
    });

    laundryTasks.forEach((t) => {
      const name = t.assignedTo || 'Unknown';
      if (!byStaff[name]) byStaff[name] = { staffName: name, assigned: 0, completed: 0 };
      byStaff[name].assigned += 1;
      if (t.status === 'Completed') byStaff[name].completed += 1;
    });

    const tasks = Object.values(byStaff).map((s) => ({
      staffName: s.staffName,
      tasksAssigned: s.assigned,
      tasksCompleted: s.completed,
      completionRate: s.assigned > 0 ? (s.completed / s.assigned) * 100 : 0,
    }));

    res.json({ tasks, startDate, endDate });
  } catch (error) {
    console.error('getTaskCompletion error:', error);
    res.status(500).json({ message: 'Failed to load task completion', error: error.message });
  }
};

exports.getSalesPerformance = async (req, res) => {
  try {
    const { CommissionTransaction } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);

    if (!CommissionTransaction) return res.json({ sales: [], startDate, endDate });

    const rows = await CommissionTransaction.findAll({
      where: {
        transactionDate: {
          [Op.between]: [startDate, endDate],
        },
      },
    });

    const byStaff = {};
    rows.forEach((t) => {
      const key = t.staffId || t.staffName;
      if (!byStaff[key]) {
        byStaff[key] = {
          staffId: t.staffId,
          staffName: t.staffName,
          department: t.department,
          totalSales: 0,
          ordersProcessed: 0,
        };
      }
      byStaff[key].totalSales += parseFloat(t.baseAmount || 0);
      byStaff[key].ordersProcessed += 1;
    });

    const sales = Object.values(byStaff).sort((a, b) => (b.totalSales || 0) - (a.totalSales || 0));
    res.json({ sales, startDate, endDate });
  } catch (error) {
    console.error('getSalesPerformance error:', error);
    res.status(500).json({ message: 'Failed to load sales performance', error: error.message });
  }
};

exports.getCommissionPerformance = async (req, res) => {
  try {
    const { CommissionTransaction } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);

    if (!CommissionTransaction) return res.json({ commissions: [], startDate, endDate });

    const rows = await CommissionTransaction.findAll({
      where: {
        transactionDate: {
          [Op.between]: [startDate, endDate],
        },
      },
    });

    const byStaff = {};
    rows.forEach((t) => {
      const key = t.staffId || t.staffName;
      if (!byStaff[key]) {
        byStaff[key] = {
          staffId: t.staffId,
          staffName: t.staffName,
          department: t.department,
          commissionAmount: 0,
        };
      }
      byStaff[key].commissionAmount += parseFloat(t.commissionAmount || 0);
    });

    const commissions = Object.values(byStaff).sort(
      (a, b) => (b.commissionAmount || 0) - (a.commissionAmount || 0),
    );

    res.json({ commissions, startDate, endDate });
  } catch (error) {
    console.error('getCommissionPerformance error:', error);
    res.status(500).json({ message: 'Failed to load commission performance', error: error.message });
  }
};

exports.getDepartmentPerformance = async (req, res) => {
  try {
    const { Attendance, CommissionTransaction } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);

    const attWhere = {
      date: { [Op.between]: [startDate, endDate] },
    };

    const [attendanceRows, commissionRows] = await Promise.all([
      Attendance.findAll({ where: attWhere }),
      CommissionTransaction
        ? CommissionTransaction.findAll({
            where: {
              transactionDate: { [Op.between]: [startDate, endDate] },
            },
          })
        : [],
    ]);

    const byDept = {};
    attendanceRows.forEach((r) => {
      const dept = r.department || 'Unassigned';
      if (!byDept[dept]) byDept[dept] = { department: dept, days: 0, presents: 0, sales: 0 };
      byDept[dept].days += 1;
      if (r.status !== 'Absent') byDept[dept].presents += 1;
    });

    commissionRows.forEach((t) => {
      const dept = t.department || 'Unassigned';
      if (!byDept[dept]) byDept[dept] = { department: dept, days: 0, presents: 0, sales: 0 };
      byDept[dept].sales += parseFloat(t.baseAmount || 0);
    });

    const departments = Object.values(byDept).map((d) => ({
      department: d.department,
      attendanceRate: d.days > 0 ? (d.presents / d.days) * 100 : 0,
      totalSales: d.sales,
    }));

    res.json({ departments, startDate, endDate });
  } catch (error) {
    console.error('getDepartmentPerformance error:', error);
    res.status(500).json({ message: 'Failed to load department performance', error: error.message });
  }
};

exports.exportStaffPerformanceReport = async (req, res) => {
  try {
    const { Attendance, CommissionTransaction } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);

    const attRows = await Attendance.findAll({
      where: { date: { [Op.between]: [startDate, endDate] } },
      order: [['staffName', 'ASC'], ['date', 'ASC']],
      limit: 500,
    });

    const attendance = attRows.map((r) => ({
      staffId: r.staffId,
      staffName: r.staffName,
      department: r.department,
      date: r.date,
      status: r.status,
      shift: r.shift,
    }));

    let commissions = [];
    if (CommissionTransaction) {
      const rows = await CommissionTransaction.findAll({
        where: {
          transactionDate: { [Op.between]: [startDate, endDate] },
        },
        limit: 500,
      });
      commissions = rows.map((t) => ({
        staffId: t.staffId,
        staffName: t.staffName,
        department: t.department,
        serviceType: t.serviceType,
        baseAmount: parseFloat(t.baseAmount || 0),
        commissionAmount: parseFloat(t.commissionAmount || 0),
        transactionDate: t.transactionDate,
      }));
    }

    res.json({
      filters: { startDate, endDate },
      attendance,
      commissions,
    });
  } catch (error) {
    console.error('exportStaffPerformanceReport error:', error);
    res.status(500).json({ message: 'Failed to export staff performance report', error: error.message });
  }
};

