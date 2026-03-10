const { Op } = require('sequelize');
const { detectConflicts } = require('../utils/shiftConflictDetector');

async function getNextShiftId(Shift) {
  const last = await Shift.findOne({
    order: [['createdAt', 'DESC']],
    attributes: ['shiftId'],
  });
  if (!last || !last.shiftId) return 'SHF001';
  const match = last.shiftId.match(/SHF(\d+)/i);
  const num = match ? parseInt(match[1], 10) + 1 : 1;
  return `SHF${String(num).padStart(3, '0')}`;
}

function getWeekBounds(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z');
  const day = d.getUTCDay();
  const start = new Date(d);
  start.setUTCDate(d.getUTCDate() - (day === 0 ? 6 : day - 1));
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

exports.fetchShifts = async (req, res) => {
  try {
    const { Shift } = req.hotelModels;
    await Shift.sync({ alter: false });
    const where = {};
    if (req.query.active !== undefined) {
      where.isActive = req.query.active === 'true';
    }
    const shifts = await Shift.findAll({
      where,
      order: [['shiftType', 'ASC'], ['startTime', 'ASC']],
    });
    res.json({ shifts: shifts.map((s) => s.toJSON()) });
  } catch (error) {
    console.error('fetchShifts error:', error);
    res.status(500).json({ message: 'Failed to load shifts', error: error.message });
  }
};

exports.createShift = async (req, res) => {
  try {
    const { Shift } = req.hotelModels;
    await Shift.sync({ alter: false });
    const { name, description, startTime, endTime, breakMinutes, isNightShift, shiftType } = req.body || {};
    if (!name || !startTime || !endTime) {
      return res.status(400).json({ message: 'Name, startTime and endTime are required' });
    }
    const shiftId = await getNextShiftId(Shift);
    const shift = await Shift.create({
      shiftId,
      name: String(name).trim(),
      description: description ? String(description).trim() : null,
      startTime: String(startTime).trim().slice(0, 5),
      endTime: String(endTime).trim().slice(0, 5),
      breakMinutes: parseInt(breakMinutes, 10) || 0,
      isNightShift: Boolean(isNightShift),
      shiftType: ['Morning', 'Evening', 'Night'].includes(shiftType) ? shiftType : 'Morning',
    });
    res.status(201).json({ shift: shift.toJSON() });
  } catch (error) {
    console.error('createShift error:', error);
    res.status(500).json({ message: 'Failed to create shift', error: error.message });
  }
};

exports.updateShift = async (req, res) => {
  try {
    const { Shift } = req.hotelModels;
    const shift = await Shift.findByPk(req.params.shiftId);
    if (!shift) return res.status(404).json({ message: 'Shift not found' });
    const { name, description, startTime, endTime, breakMinutes, isNightShift, shiftType, isActive } = req.body || {};
    if (name !== undefined) shift.name = String(name).trim();
    if (description !== undefined) shift.description = description ? String(description).trim() : null;
    if (startTime !== undefined) shift.startTime = String(startTime).trim().slice(0, 5);
    if (endTime !== undefined) shift.endTime = String(endTime).trim().slice(0, 5);
    if (breakMinutes !== undefined) shift.breakMinutes = parseInt(breakMinutes, 10) || 0;
    if (isNightShift !== undefined) shift.isNightShift = Boolean(isNightShift);
    if (shiftType !== undefined && ['Morning', 'Evening', 'Night'].includes(shiftType))
      shift.shiftType = shiftType;
    if (isActive !== undefined) shift.isActive = Boolean(isActive);
    await shift.save();
    res.json({ shift: shift.toJSON() });
  } catch (error) {
    console.error('updateShift error:', error);
    res.status(500).json({ message: 'Failed to update shift', error: error.message });
  }
};

exports.deleteShift = async (req, res) => {
  try {
    const { Shift } = req.hotelModels;
    const shift = await Shift.findByPk(req.params.shiftId);
    if (!shift) return res.status(404).json({ message: 'Shift not found' });
    shift.isActive = false;
    await shift.save();
    res.json({ message: 'Shift deactivated' });
  } catch (error) {
    console.error('deleteShift error:', error);
    res.status(500).json({ message: 'Failed to delete shift', error: error.message });
  }
};

exports.assignShiftToStaff = async (req, res) => {
  try {
    const { Shift, ShiftAssignment, StaffMember } = req.hotelModels;
    await Promise.all([
      Shift.sync({ alter: false }),
      ShiftAssignment.sync({ alter: false }),
      StaffMember.sync({ alter: false }),
    ]);
    const { staffIds, shiftId, date, notes } = req.body || {};
    const staffIdList = Array.isArray(staffIds) ? staffIds : staffIds ? [staffIds] : [];
    if (!staffIdList.length || !shiftId || !date) {
      return res.status(400).json({ message: 'staffIds (array), shiftId and date are required' });
    }
    const shift = await Shift.findByPk(shiftId);
    if (!shift) return res.status(404).json({ message: 'Shift not found' });
    const dateStr = String(date).slice(0, 10);
    const staff = await StaffMember.findAll({
      where: { id: { [Op.in]: staffIdList }, isActive: true },
    });
    const created = [];
    for (const s of staff) {
      const [record, wasCreated] = await ShiftAssignment.findOrCreate({
        where: { staffId: s.id, date: dateStr },
        defaults: {
          staffId: s.id,
          staffName: s.name,
          shiftId: shift.id,
          shiftName: shift.name,
          date: dateStr,
          notes: notes || null,
        },
      });
      if (!wasCreated) {
        await record.update({
          shiftId: shift.id,
          shiftName: shift.name,
          notes: notes || null,
        });
      }
      created.push(record);
    }
    res.status(201).json({ assignments: created.map((a) => a.toJSON()) });
  } catch (error) {
    console.error('assignShiftToStaff error:', error);
    res.status(500).json({ message: 'Failed to assign shift', error: error.message });
  }
};

exports.fetchShiftSchedule = async (req, res) => {
  try {
    const { Shift, ShiftAssignment, StaffMember } = req.hotelModels;
    await Promise.all([
      Shift.sync({ alter: false }),
      ShiftAssignment.sync({ alter: false }),
      StaffMember.sync({ alter: false }),
    ]);
    const { weekStart, date } = req.query;
    const ref = weekStart || date || new Date().toISOString().slice(0, 10);
    const { start, end } = getWeekBounds(ref);
    const assignments = await ShiftAssignment.findAll({
      where: { date: { [Op.between]: [start, end] } },
      order: [['date', 'ASC'], ['shiftName', 'ASC'], ['staffName', 'ASC']],
    });
    const shifts = await Shift.findAll({ where: { isActive: true } });
    const shiftMap = {};
    shifts.forEach((s) => {
      shiftMap[s.id] = s.toJSON();
    });
    const days = [];
    for (let d = new Date(start); d <= new Date(end); d.setUTCDate(d.getUTCDate() + 1)) {
      const dateStr = d.toISOString().slice(0, 10);
      const dayAssignments = assignments
        .filter((a) => a.date === dateStr)
        .map((a) => ({
          ...a.toJSON(),
          shift: shiftMap[a.shiftId],
        }));
      days.push({ date: dateStr, assignments: dayAssignments });
    }
    res.json({ weekStart: start, weekEnd: end, days, shifts: shifts.map((s) => s.toJSON()) });
  } catch (error) {
    console.error('fetchShiftSchedule error:', error);
    res.status(500).json({ message: 'Failed to load shift schedule', error: error.message });
  }
};

exports.checkConflict = async (req, res) => {
  try {
    const { Shift, ShiftAssignment } = req.hotelModels;
    const { staffId, shiftId, date } = req.query;
    if (!staffId || !shiftId || !date) {
      return res.status(400).json({ message: 'staffId, shiftId and date are required' });
    }
    const shift = await Shift.findByPk(shiftId);
    if (!shift) return res.status(404).json({ message: 'Shift not found' });
    const { start, end } = getWeekBounds(date);
    const assignments = await ShiftAssignment.findAll({
      where: {
        staffId,
        date: { [Op.between]: [start, end] },
      },
    });
    const assignmentsWithShift = await Promise.all(
      assignments.map(async (a) => {
        const s = await Shift.findByPk(a.shiftId);
        return { ...a.toJSON(), shift: s ? s.toJSON() : null };
      })
    );
    const conflicts = detectConflicts(assignmentsWithShift, {
      staffId,
      date: String(date).slice(0, 10),
      shift: shift.toJSON(),
    });
    res.json({ conflicts });
  } catch (error) {
    console.error('checkConflict error:', error);
    res.status(500).json({ message: 'Failed to check conflict', error: error.message });
  }
};

exports.requestShiftChange = async (req, res) => {
  try {
    const { Shift, ShiftAssignment, ShiftChangeRequest } = req.hotelModels;
    await Promise.all([
      Shift.sync({ alter: false }),
      ShiftAssignment.sync({ alter: false }),
      ShiftChangeRequest.sync({ alter: false }),
    ]);
    const { staffId, staffName, currentShiftId, currentDate, requestedShiftId, requestedDate, reason } = req.body || {};
    if (!staffId || !staffName || !requestedShiftId || !requestedDate) {
      return res.status(400).json({ message: 'staffId, staffName, requestedShiftId and requestedDate are required' });
    }
    const requestedShift = await Shift.findByPk(requestedShiftId);
    if (!requestedShift) return res.status(404).json({ message: 'Requested shift not found' });
    const curDate = String(currentDate || requestedDate).slice(0, 10);
    const reqDate = String(requestedDate).slice(0, 10);
    let currentShiftName = null;
    if (currentShiftId) {
      const s = await Shift.findByPk(currentShiftId);
      currentShiftName = s ? s.name : null;
    }
    const req = await ShiftChangeRequest.create({
      staffId,
      staffName,
      currentShiftId: currentShiftId || null,
      currentShiftName,
      currentDate: curDate,
      requestedShiftId: requestedShift.id,
      requestedShiftName: requestedShift.name,
      requestedDate: reqDate,
      reason: reason || null,
      status: 'pending',
    });
    res.status(201).json({ request: req.toJSON() });
  } catch (error) {
    console.error('requestShiftChange error:', error);
    res.status(500).json({ message: 'Failed to create shift change request', error: error.message });
  }
};

exports.fetchShiftChangeRequests = async (req, res) => {
  try {
    const { ShiftChangeRequest } = req.hotelModels;
    await ShiftChangeRequest.sync({ alter: false });
    const where = {};
    if (req.query.status) where.status = req.query.status;
    const requests = await ShiftChangeRequest.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
    res.json({ requests: requests.map((r) => r.toJSON()) });
  } catch (error) {
    console.error('fetchShiftChangeRequests error:', error);
    res.status(500).json({ message: 'Failed to load shift change requests', error: error.message });
  }
};

exports.approveShiftChange = async (req, res) => {
  try {
    const { Shift, ShiftAssignment, ShiftChangeRequest } = req.hotelModels;
    const request = await ShiftChangeRequest.findByPk(req.params.requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is not pending' });
    }
    request.status = 'approved';
    request.approvedBy = req.user?.name || req.user?.email || 'Manager';
    request.approvedAt = new Date();
    await request.save();
    const shift = await Shift.findByPk(request.requestedShiftId);
    if (shift) {
      const [assignment] = await ShiftAssignment.findOrCreate({
        where: { staffId: request.staffId, date: request.requestedDate },
        defaults: {
          staffId: request.staffId,
          staffName: request.staffName,
          shiftId: shift.id,
          shiftName: shift.name,
          date: request.requestedDate,
        },
      });
      if (!assignment.createdAt || assignment.updatedAt > assignment.createdAt) {
        await assignment.update({ shiftId: shift.id, shiftName: shift.name });
      }
    }
    res.json({ request: request.toJSON() });
  } catch (error) {
    console.error('approveShiftChange error:', error);
    res.status(500).json({ message: 'Failed to approve shift change', error: error.message });
  }
};

exports.rejectShiftChange = async (req, res) => {
  try {
    const { ShiftChangeRequest } = req.hotelModels;
    const request = await ShiftChangeRequest.findByPk(req.params.requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is not pending' });
    }
    request.status = 'rejected';
    request.approvedBy = req.user?.name || req.user?.email || 'Manager';
    request.approvedAt = new Date();
    request.rejectionReason = req.body?.reason || null;
    await request.save();
    res.json({ request: request.toJSON() });
  } catch (error) {
    console.error('rejectShiftChange error:', error);
    res.status(500).json({ message: 'Failed to reject shift change', error: error.message });
  }
};

exports.exportShiftSchedule = async (req, res) => {
  try {
    const { ShiftAssignment } = req.hotelModels;
    const { weekStart, date } = req.query;
    const ref = weekStart || date || new Date().toISOString().slice(0, 10);
    const { start, end } = getWeekBounds(ref);
    const assignments = await ShiftAssignment.findAll({
      where: { date: { [Op.between]: [start, end] } },
      order: [['date', 'ASC'], ['staffName', 'ASC']],
    });
    res.json({
      weekStart: start,
      weekEnd: end,
      export: assignments.map((a) => a.toJSON()),
    });
  } catch (error) {
    console.error('exportShiftSchedule error:', error);
    res.status(500).json({ message: 'Failed to export shift schedule', error: error.message });
  }
};

exports.fetchStaff = async (req, res) => {
  try {
    const { StaffMember } = req.hotelModels;
    await StaffMember.sync({ alter: false });
    const staff = await StaffMember.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']],
    });
    res.json({ staff: staff.map((s) => s.toJSON()) });
  } catch (error) {
    console.error('fetchStaff error:', error);
    res.status(500).json({ message: 'Failed to load staff', error: error.message });
  }
};
