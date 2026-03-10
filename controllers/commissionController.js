const { Op } = require('sequelize');
const { calculateCommission } = require('../utils/commissionCalculator');

exports.fetchCommissionRules = async (req, res) => {
  try {
    const { CommissionRule } = req.hotelModels;
    await CommissionRule.sync({ alter: false });
    const rules = await CommissionRule.findAll({
      order: [['createdAt', 'DESC']],
    });
    res.json({ rules: rules.map((r) => r.toJSON()) });
  } catch (error) {
    console.error('fetchCommissionRules error:', error);
    res.status(500).json({ message: 'Failed to load commission rules', error: error.message });
  }
};

exports.createCommissionRule = async (req, res) => {
  try {
    const { CommissionRule } = req.hotelModels;
    await CommissionRule.sync({ alter: false });
    const { name, serviceType, commissionType, value, appliesTo, staffId, staffName, department } = req.body || {};
    if (!name || !serviceType || !commissionType || value == null) {
      return res.status(400).json({ message: 'name, serviceType, commissionType and value are required' });
    }
    const rule = await CommissionRule.create({
      name: String(name).trim(),
      serviceType: String(serviceType).trim(),
      commissionType: commissionType === 'FIXED' ? 'FIXED' : 'PERCENT',
      value: parseFloat(value) || 0,
      appliesTo: appliesTo && ['GLOBAL', 'STAFF', 'DEPARTMENT'].includes(appliesTo) ? appliesTo : 'GLOBAL',
      staffId: staffId || null,
      staffName: staffName || null,
      department: department || null,
    });
    res.status(201).json({ rule: rule.toJSON() });
  } catch (error) {
    console.error('createCommissionRule error:', error);
    res.status(500).json({ message: 'Failed to create commission rule', error: error.message });
  }
};

exports.assignCommissionToStaff = async (req, res) => {
  try {
    const { CommissionRule, StaffMember } = req.hotelModels;
    await Promise.all([
      CommissionRule.sync({ alter: false }),
      StaffMember.sync({ alter: false }),
    ]);
    const { ruleId, staffId } = req.body || {};
    if (!ruleId || !staffId) {
      return res.status(400).json({ message: 'ruleId and staffId are required' });
    }
    const baseRule = await CommissionRule.findByPk(ruleId);
    if (!baseRule) return res.status(404).json({ message: 'Rule not found' });
    const staff = await StaffMember.findByPk(staffId);
    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    const staffRule = await CommissionRule.create({
      name: `${baseRule.name} - ${staff.name}`,
      serviceType: baseRule.serviceType,
      commissionType: baseRule.commissionType,
      value: baseRule.value,
      appliesTo: 'STAFF',
      staffId: staff.id,
      staffName: staff.name,
      department: staff.department || null,
    });
    res.status(201).json({ rule: staffRule.toJSON() });
  } catch (error) {
    console.error('assignCommissionToStaff error:', error);
    res.status(500).json({ message: 'Failed to assign commission', error: error.message });
  }
};

exports.calculateCommission = async (req, res) => {
  try {
    const { CommissionRule, CommissionTransaction, StaffMember } = req.hotelModels;
    await Promise.all([
      CommissionRule.sync({ alter: false }),
      CommissionTransaction.sync({ alter: false }),
      StaffMember.sync({ alter: false }),
    ]);
    const { ruleId, staffId, baseAmount, serviceType, createTransaction = true, notes } = req.body || {};
    if (!ruleId || !staffId || baseAmount == null) {
      return res.status(400).json({ message: 'ruleId, staffId and baseAmount are required' });
    }
    const rule = await CommissionRule.findByPk(ruleId);
    if (!rule) return res.status(404).json({ message: 'Rule not found' });
    const staff = await StaffMember.findByPk(staffId);
    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    const { commissionAmount } = calculateCommission(rule.toJSON(), baseAmount);
    const today = new Date().toISOString().slice(0, 10);

    let tx = null;
    if (createTransaction) {
      tx = await CommissionTransaction.create({
        staffId: staff.id,
        staffName: staff.name,
        department: staff.department || null,
        ruleId: rule.id,
        ruleName: rule.name,
        serviceType: serviceType || rule.serviceType,
        baseAmount: parseFloat(baseAmount) || 0,
        commissionAmount,
        transactionDate: today,
        status: 'pending',
        notes: notes || null,
      });
    }

    res.status(201).json({
      commission: {
        staffId: staff.id,
        staffName: staff.name,
        ruleId: rule.id,
        ruleName: rule.name,
        serviceType: serviceType || rule.serviceType,
        baseAmount: parseFloat(baseAmount) || 0,
        commissionAmount,
        transactionId: tx ? tx.id : null,
      },
    });
  } catch (error) {
    console.error('calculateCommission error:', error);
    res.status(500).json({ message: 'Failed to calculate commission', error: error.message });
  }
};

exports.fetchCommissionList = async (req, res) => {
  try {
    const { CommissionTransaction } = req.hotelModels;
    await CommissionTransaction.sync({ alter: false });
    const { month, year, staffId, status } = req.query;
    const where = {};
    if (staffId) where.staffId = staffId;
    if (status) where.status = status;
    if (month && year) {
      const y = parseInt(year, 10);
      const m = parseInt(month, 10);
      const start = `${y}-${String(m).padStart(2, '0')}-01`;
      const end = new Date(y, m, 0).toISOString().slice(0, 10);
      where.transactionDate = { [Op.between]: [start, end] };
    }

    const list = await CommissionTransaction.findAll({
      where,
      order: [['transactionDate', 'DESC'], ['createdAt', 'DESC']],
    });
    res.json({ list: list.map((t) => t.toJSON()) });
  } catch (error) {
    console.error('fetchCommissionList error:', error);
    res.status(500).json({ message: 'Failed to load commission list', error: error.message });
  }
};

exports.updateCommissionPayout = async (req, res) => {
  try {
    const { CommissionTransaction } = req.hotelModels;
    await CommissionTransaction.sync({ alter: false });
    const { id } = req.params;
    const { status, paymentMethod, paymentReference } = req.body || {};
    const tx = await CommissionTransaction.findByPk(id);
    if (!tx) return res.status(404).json({ message: 'Commission transaction not found' });

    if (status && ['pending', 'paid', 'overdue'].includes(status)) {
      tx.status = status;
    }
    if (status === 'paid' && !tx.paidAt) {
      tx.paidAt = new Date();
    }
    if (paymentMethod !== undefined) tx.paymentMethod = paymentMethod || null;
    if (paymentReference !== undefined) tx.paymentReference = paymentReference || null;

    await tx.save();
    res.json({ transaction: tx.toJSON() });
  } catch (error) {
    console.error('updateCommissionPayout error:', error);
    res.status(500).json({ message: 'Failed to update payout', error: error.message });
  }
};

exports.fetchCommissionReports = async (req, res) => {
  try {
    const { CommissionTransaction } = req.hotelModels;
    await CommissionTransaction.sync({ alter: false });
    const { month, year } = req.query;
    const where = {};
    if (month && year) {
      const y = parseInt(year, 10);
      const m = parseInt(month, 10);
      const start = `${y}-${String(m).padStart(2, '0')}-01`;
      const end = new Date(y, m, 0).toISOString().slice(0, 10);
      where.transactionDate = { [Op.between]: [start, end] };
    }

    const list = await CommissionTransaction.findAll({ where });
    let total = 0;
    let paid = 0;
    let pending = 0;
    const byStaff = {};
    const byDept = {};

    list.forEach((t) => {
      const amt = parseFloat(t.commissionAmount || 0);
      total += amt;
      if (t.status === 'paid') paid += amt;
      else pending += amt;
      const staffKey = t.staffName || t.staffId;
      if (!byStaff[staffKey]) byStaff[staffKey] = { staffName: t.staffName, total: 0 };
      byStaff[staffKey].total += amt;
      const deptKey = t.department || 'Unassigned';
      if (!byDept[deptKey]) byDept[deptKey] = { department: deptKey, total: 0 };
      byDept[deptKey].total += amt;
    });

    res.json({
      summary: {
        totalCommission: total,
        totalPaid: paid,
        totalPending: pending,
        transactionCount: list.length,
      },
      byStaff: Object.values(byStaff),
      byDepartment: Object.values(byDept),
    });
  } catch (error) {
    console.error('fetchCommissionReports error:', error);
    res.status(500).json({ message: 'Failed to load commission reports', error: error.message });
  }
};

