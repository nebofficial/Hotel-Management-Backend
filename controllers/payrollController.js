const { Op } = require('sequelize');
const { calculateSalary } = require('../utils/salaryCalculator');

const DEFAULT_ALLOWANCE_TYPES = [
  { code: 'HRA', name: 'House Rent Allowance', isPercent: true },
  { code: 'TRAVEL', name: 'Travel Allowance', isPercent: false },
  { code: 'FOOD', name: 'Food Allowance', isPercent: false },
];

const DEFAULT_DEDUCTION_TYPES = [
  { code: 'TDS', name: 'Tax Deduction (TDS)', isPercent: true },
  { code: 'PF', name: 'Provident Fund', isPercent: true },
  { code: 'INSURANCE', name: 'Insurance', isPercent: false },
  { code: 'LEAVE', name: 'Leave Deduction', isPercent: false },
];

async function ensureDefaultTypes(AllowanceType, DeductionType) {
  await AllowanceType.sync({ alter: false });
  await DeductionType.sync({ alter: false });
  const existingAllow = await AllowanceType.count();
  if (existingAllow === 0) {
    await AllowanceType.bulkCreate(DEFAULT_ALLOWANCE_TYPES);
  }
  const existingDed = await DeductionType.count();
  if (existingDed === 0) {
    await DeductionType.bulkCreate(DEFAULT_DEDUCTION_TYPES);
  }
}

exports.fetchSalaryStructure = async (req, res) => {
  try {
    const { SalaryStructure, StaffMember } = req.hotelModels;
    await SalaryStructure.sync({ alter: false });
    const staffId = req.query.staffId;
    const where = staffId ? { staffId } : {};
    const structures = await SalaryStructure.findAll({
      where: { ...where, effectiveTo: { [Op.or]: [null, { [Op.gte]: new Date().toISOString().slice(0, 10) }] } },
      order: [['effectiveFrom', 'DESC']],
    });
    res.json({ structures: structures.map((s) => s.toJSON()) });
  } catch (error) {
    console.error('fetchSalaryStructure error:', error);
    res.status(500).json({ message: 'Failed to load salary structure', error: error.message });
  }
};

exports.setupSalaryStructure = async (req, res) => {
  try {
    const { SalaryStructure } = req.hotelModels;
    await SalaryStructure.sync({ alter: false });
    const { staffId, staffName, basicSalary, overtimeRatePerHour } = req.body || {};
    if (!staffId || !staffName || basicSalary == null) {
      return res.status(400).json({ message: 'staffId, staffName and basicSalary are required' });
    }
    const effectiveFrom = req.body.effectiveFrom || new Date().toISOString().slice(0, 10);
    const existing = await SalaryStructure.findOne({
      where: { staffId, effectiveTo: null },
    });
    if (existing) {
      existing.effectiveTo = effectiveFrom;
      await existing.save();
    }
    const structure = await SalaryStructure.create({
      staffId,
      staffName,
      basicSalary: parseFloat(basicSalary) || 0,
      overtimeRatePerHour: parseFloat(overtimeRatePerHour) || 0,
      effectiveFrom,
    });
    res.status(201).json({ structure: structure.toJSON() });
  } catch (error) {
    console.error('setupSalaryStructure error:', error);
    res.status(500).json({ message: 'Failed to setup salary', error: error.message });
  }
};

exports.fetchAllowanceTypes = async (req, res) => {
  try {
    const { AllowanceType } = req.hotelModels;
    await ensureDefaultTypes(req.hotelModels.AllowanceType, req.hotelModels.DeductionType);
    const types = await AllowanceType.findAll({ order: [['code', 'ASC']] });
    res.json({ allowanceTypes: types.map((t) => t.toJSON()) });
  } catch (error) {
    console.error('fetchAllowanceTypes error:', error);
    res.status(500).json({ message: 'Failed to load allowance types', error: error.message });
  }
};

exports.fetchStaffAllowances = async (req, res) => {
  try {
    const { StaffAllowance, AllowanceType } = req.hotelModels;
    await StaffAllowance.sync({ alter: false });
    const staffId = req.query.staffId;
    const allowances = await StaffAllowance.findAll({
      where: staffId ? { staffId } : {},
      order: [['staffId', 'ASC']],
    });
    const types = await AllowanceType.findAll();
    const typeMap = {};
    types.forEach((t) => { typeMap[t.id] = t.toJSON(); });
    const enriched = allowances.map((a) => {
      const j = a.toJSON();
      j.allowanceType = typeMap[a.allowanceTypeId];
      return j;
    });
    res.json({ allowances: enriched });
  } catch (error) {
    console.error('fetchStaffAllowances error:', error);
    res.status(500).json({ message: 'Failed to load allowances', error: error.message });
  }
};

exports.upsertStaffAllowance = async (req, res) => {
  try {
    const { StaffAllowance } = req.hotelModels;
    const { staffId, allowanceTypeId, value } = req.body || {};
    if (!staffId || !allowanceTypeId || value == null) {
      return res.status(400).json({ message: 'staffId, allowanceTypeId and value are required' });
    }
    const [record] = await StaffAllowance.findOrCreate({
      where: { staffId, allowanceTypeId },
      defaults: { staffId, allowanceTypeId, value: parseFloat(value) || 0 },
    });
    if (!record.createdAt || record.updatedAt > record.createdAt) {
      await record.update({ value: parseFloat(value) || 0 });
    }
    res.json({ allowance: record.toJSON() });
  } catch (error) {
    console.error('upsertStaffAllowance error:', error);
    res.status(500).json({ message: 'Failed to save allowance', error: error.message });
  }
};

exports.fetchDeductionTypes = async (req, res) => {
  try {
    const { DeductionType } = req.hotelModels;
    await ensureDefaultTypes(req.hotelModels.AllowanceType, req.hotelModels.DeductionType);
    const types = await DeductionType.findAll({ order: [['code', 'ASC']] });
    res.json({ deductionTypes: types.map((t) => t.toJSON()) });
  } catch (error) {
    console.error('fetchDeductionTypes error:', error);
    res.status(500).json({ message: 'Failed to load deduction types', error: error.message });
  }
};

exports.fetchStaffDeductions = async (req, res) => {
  try {
    const { StaffDeduction, DeductionType } = req.hotelModels;
    await StaffDeduction.sync({ alter: false });
    const staffId = req.query.staffId;
    const deductions = await StaffDeduction.findAll({
      where: staffId ? { staffId } : {},
    });
    const types = await DeductionType.findAll();
    const typeMap = {};
    types.forEach((t) => { typeMap[t.id] = t.toJSON(); });
    const enriched = deductions.map((d) => {
      const j = d.toJSON();
      j.deductionType = typeMap[d.deductionTypeId];
      return j;
    });
    res.json({ deductions: enriched });
  } catch (error) {
    console.error('fetchStaffDeductions error:', error);
    res.status(500).json({ message: 'Failed to load deductions', error: error.message });
  }
};

exports.upsertStaffDeduction = async (req, res) => {
  try {
    const { StaffDeduction } = req.hotelModels;
    const { staffId, deductionTypeId, value } = req.body || {};
    if (!staffId || !deductionTypeId || value == null) {
      return res.status(400).json({ message: 'staffId, deductionTypeId and value are required' });
    }
    const [record] = await StaffDeduction.findOrCreate({
      where: { staffId, deductionTypeId },
      defaults: { staffId, deductionTypeId, value: parseFloat(value) || 0 },
    });
    if (!record.createdAt || record.updatedAt > record.createdAt) {
      await record.update({ value: parseFloat(value) || 0 });
    }
    res.json({ deduction: record.toJSON() });
  } catch (error) {
    console.error('upsertStaffDeduction error:', error);
    res.status(500).json({ message: 'Failed to save deduction', error: error.message });
  }
};

exports.addBonus = async (req, res) => {
  try {
    const { StaffBonus } = req.hotelModels;
    await StaffBonus.sync({ alter: false });
    const { staffId, staffName, month, year, amount, reason } = req.body || {};
    if (!staffId || !staffName || !month || !year || amount == null) {
      return res.status(400).json({ message: 'staffId, staffName, month, year and amount are required' });
    }
    const bonus = await StaffBonus.create({
      staffId,
      staffName,
      month: parseInt(month, 10),
      year: parseInt(year, 10),
      amount: parseFloat(amount) || 0,
      reason: reason || null,
    });
    res.status(201).json({ bonus: bonus.toJSON() });
  } catch (error) {
    console.error('addBonus error:', error);
    res.status(500).json({ message: 'Failed to add bonus', error: error.message });
  }
};

exports.generatePayroll = async (req, res) => {
  try {
    const models = req.hotelModels;
    const { SalaryStructure, StaffMember, StaffAllowance, AllowanceType, StaffDeduction, DeductionType, StaffBonus, PayrollRun, PayrollEntry, Attendance } = models;
    await Promise.all([
      SalaryStructure.sync({ alter: false }),
      StaffMember.sync({ alter: false }),
      StaffAllowance.sync({ alter: false }),
      AllowanceType.sync({ alter: false }),
      StaffDeduction.sync({ alter: false }),
      DeductionType.sync({ alter: false }),
      StaffBonus.sync({ alter: false }),
      PayrollRun.sync({ alter: false }),
      PayrollEntry.sync({ alter: false }),
      Attendance.sync({ alter: false }),
    ]);

    const { month, year, department } = req.body || {};
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    if (!m || !y) return res.status(400).json({ message: 'month and year are required' });

    const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
    const endDate = new Date(y, m, 0).toISOString().slice(0, 10);

    let staff = await StaffMember.findAll({ where: { isActive: true } });
    if (department && department !== 'all') {
      staff = staff.filter((s) => (s.department || '').toLowerCase() === (department || '').toLowerCase());
    }

    const structures = await SalaryStructure.findAll({
      where: {
        staffId: { [Op.in]: staff.map((s) => s.id) },
        effectiveFrom: { [Op.lte]: endDate },
        [Op.or]: [{ effectiveTo: null }, { effectiveTo: { [Op.gte]: startDate } }],
      },
    });
    const structMap = {};
    structures.forEach((s) => { structMap[s.staffId] = s; });

    const allowances = await StaffAllowance.findAll();
    const allowanceTypes = await AllowanceType.findAll();
    const deductions = await StaffDeduction.findAll();
    const deductionTypes = await DeductionType.findAll();
    const bonuses = await StaffBonus.findAll({ where: { month: m, year: y } });
    const bonusMap = {};
    bonuses.forEach((b) => { bonusMap[b.staffId] = (bonusMap[b.staffId] || 0) + parseFloat(b.amount || 0); });

    const attRecords = await Attendance.findAll({
      where: { staffId: { [Op.in]: staff.map((s) => s.id) }, date: { [Op.between]: [startDate, endDate] } },
    });

    let workHoursMap = {};
    let absentMap = {};
    attRecords.forEach((a) => {
      const sid = a.staffId;
      workHoursMap[sid] = (workHoursMap[sid] || 0) + parseFloat(a.workHours || 0);
      if (a.status === 'Absent') absentMap[sid] = (absentMap[sid] || 0) + 1;
    });

    const [run, created] = await PayrollRun.findOrCreate({
      where: { month: m, year: y, department: department || null },
      defaults: { month: m, year: y, department: department || null, status: 'draft' },
    });
    if (!created) {
      await PayrollEntry.destroy({ where: { payrollRunId: run.id } });
    }

    const daysInMonth = new Date(y, m, 0).getDate();
    let totalAmount = 0;
    const entries = [];

    for (const s of staff) {
      const struct = structMap[s.id];
      if (!struct) continue;

      const basicSalary = parseFloat(struct.basicSalary || 0);
      const overtimeRate = parseFloat(struct.overtimeRatePerHour || 0);
      const staffAllowances = allowances.filter((a) => a.staffId === s.id);
      const staffDed = deductions.filter((d) => d.staffId === s.id);
      const workHours = workHoursMap[s.id] || 0;
      const standardHours = daysInMonth * 8;
      const overtimeHours = Math.max(0, workHours - standardHours);
      const bonusAmount = bonusMap[s.id] || 0;
      const absentDays = absentMap[s.id] || 0;
      const leaveDeduction = absentDays * (basicSalary / daysInMonth);

      const calc = calculateSalary({
        basicSalary,
        overtimeHours,
        overtimeRate,
        staffAllowances,
        allowanceTypes,
        staffDeductions: staffDed,
        deductionTypes,
        bonusAmount,
        leaveDeduction,
      });

      const entry = await PayrollEntry.create({
        payrollRunId: run.id,
        staffId: s.id,
        staffName: s.name,
        department: s.department || null,
        basicSalary: calc.basicSalary,
        allowancesTotal: calc.allowancesTotal,
        deductionsTotal: calc.deductionsTotal,
        overtimePay: calc.overtimePay,
        bonusAmount: calc.bonusAmount,
        leaveDeduction: calc.leaveDeduction,
        grossSalary: calc.grossSalary,
        netSalary: calc.netSalary,
        allowancesBreakdown: calc.allowancesBreakdown,
        deductionsBreakdown: calc.deductionsBreakdown,
        status: 'pending',
      });
      entries.push(entry);
      totalAmount += calc.netSalary;
    }

    await run.update({ totalAmount, status: 'draft' });

    res.status(201).json({
      payrollRun: run.toJSON(),
      entries: entries.map((e) => e.toJSON()),
    });
  } catch (error) {
    console.error('generatePayroll error:', error);
    res.status(500).json({ message: 'Failed to generate payroll', error: error.message });
  }
};

exports.fetchPayrollList = async (req, res) => {
  try {
    const { PayrollRun, PayrollEntry } = req.hotelModels;
    await PayrollRun.sync({ alter: false });
    await PayrollEntry.sync({ alter: false });

    const { month, year, department } = req.query;
    const where = {};
    if (month) where.month = parseInt(month, 10);
    if (year) where.year = parseInt(year, 10);
    if (department && department !== 'all') where.department = department;

    const runs = await PayrollRun.findAll({ where, order: [['year', 'DESC'], ['month', 'DESC']] });
    const runIds = runs.map((r) => r.id);
    const entries = await PayrollEntry.findAll({
      where: { payrollRunId: { [Op.in]: runIds } },
      order: [['staffName', 'ASC']],
    });

    const runMap = {};
    runs.forEach((r) => { runMap[r.id] = r.toJSON(); });
    const entriesByRun = {};
    entries.forEach((e) => {
      const rid = e.payrollRunId;
      if (!entriesByRun[rid]) entriesByRun[rid] = [];
      entriesByRun[rid].push(e.toJSON());
    });

    res.json({
      runs: runs.map((r) => ({ ...runMap[r.id], entries: entriesByRun[r.id] || [] })),
    });
  } catch (error) {
    console.error('fetchPayrollList error:', error);
    res.status(500).json({ message: 'Failed to load payroll', error: error.message });
  }
};

exports.markPayrollPaid = async (req, res) => {
  try {
    const { PayrollEntry } = req.hotelModels;
    const { entryId } = req.params;
    const { paymentMethod, paymentReference } = req.body || {};
    const entry = await PayrollEntry.findByPk(entryId);
    if (!entry) return res.status(404).json({ message: 'Payroll entry not found' });
    entry.status = 'paid';
    entry.paidAt = new Date();
    entry.paymentMethod = paymentMethod || null;
    entry.paymentReference = paymentReference || null;
    await entry.save();
    res.json({ entry: entry.toJSON() });
  } catch (error) {
    console.error('markPayrollPaid error:', error);
    res.status(500).json({ message: 'Failed to mark paid', error: error.message });
  }
};

exports.fetchPaymentHistory = async (req, res) => {
  try {
    const { PayrollEntry } = req.hotelModels;
    const entries = await PayrollEntry.findAll({
      where: { status: 'paid' },
      order: [['paidAt', 'DESC']],
      limit: 100,
    });
    res.json({ history: entries.map((e) => e.toJSON()) });
  } catch (error) {
    console.error('fetchPaymentHistory error:', error);
    res.status(500).json({ message: 'Failed to load payment history', error: error.message });
  }
};

exports.fetchPayrollReports = async (req, res) => {
  try {
    const { PayrollRun, PayrollEntry } = req.hotelModels;
    const { month, year } = req.query;
    const where = {};
    if (month) where.month = parseInt(month, 10);
    if (year) where.year = parseInt(year, 10);

    const runs = await PayrollRun.findAll({ where });
    const runIds = runs.map((r) => r.id);
    const entries = await PayrollEntry.findAll({ where: { payrollRunId: { [Op.in]: runIds } } });

    const byDept = {};
    let totalNet = 0;
    let totalPaid = 0;
    let totalPending = 0;
    entries.forEach((e) => {
      const d = e.department || 'Unassigned';
      if (!byDept[d]) byDept[d] = { total: 0, paid: 0, pending: 0, count: 0 };
      byDept[d].total += parseFloat(e.netSalary || 0);
      byDept[d].count += 1;
      if (e.status === 'paid') byDept[d].paid += parseFloat(e.netSalary || 0);
      else byDept[d].pending += parseFloat(e.netSalary || 0);
      totalNet += parseFloat(e.netSalary || 0);
      if (e.status === 'paid') totalPaid += parseFloat(e.netSalary || 0);
      else totalPending += parseFloat(e.netSalary || 0);
    });

    res.json({
      summary: { totalNet, totalPaid, totalPending, employeeCount: entries.length },
      byDepartment: Object.entries(byDept).map(([name, data]) => ({ department: name, ...data })),
    });
  } catch (error) {
    console.error('fetchPayrollReports error:', error);
    res.status(500).json({ message: 'Failed to load reports', error: error.message });
  }
};

exports.fetchStaffForPayroll = async (req, res) => {
  try {
    const { StaffMember, SalaryStructure } = req.hotelModels;
    await Promise.all([StaffMember.sync({ alter: false }), SalaryStructure.sync({ alter: false })]);
    const staff = await StaffMember.findAll({ where: { isActive: true }, order: [['name', 'ASC']] });
    const structures = await SalaryStructure.findAll({
      where: { effectiveTo: { [Op.or]: [null, { [Op.gte]: new Date().toISOString().slice(0, 10) }] } },
    });
    const structMap = {};
    structures.forEach((s) => { structMap[s.staffId] = s.toJSON(); });
    const enriched = staff.map((s) => {
      const j = s.toJSON();
      j.salaryStructure = structMap[s.id];
      return j;
    });
    res.json({ staff: enriched });
  } catch (error) {
    console.error('fetchStaffForPayroll error:', error);
    res.status(500).json({ message: 'Failed to load staff', error: error.message });
  }
};
