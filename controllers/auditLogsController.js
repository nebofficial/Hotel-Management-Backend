const { Op } = require('sequelize');
const PermissionAudit = require('../models/PermissionAudit');

function parseDateRange(req) {
  const start = req.query.startDate || null;
  const end = req.query.endDate || null;
  const endDate = end ? new Date(end) : new Date();
  const startDate = start ? new Date(start) : new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  return {
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10),
  };
}

function getDateFilter(startDate, endDate) {
  return {
    [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')],
  };
}

exports.getLoginActivity = async (req, res) => {
  try {
    // Login audit is not persisted separately yet; return empty list for now.
    res.json({ logs: [], startDate: null, endDate: null });
  } catch (error) {
    console.error('getLoginActivity error:', error);
    res.status(500).json({ message: 'Failed to load login activity', error: error.message });
  }
};

exports.getSystemChanges = async (req, res) => {
  try {
    const { startDate, endDate } = parseDateRange(req);
    const hotelId = req.hotel.id;

    const rows = await PermissionAudit.findAll({
      where: {
        hotelId,
        createdAt: getDateFilter(startDate, endDate),
      },
      order: [['createdAt', 'DESC']],
      limit: 200,
    });

    const logs = rows.map((r) => ({
      id: r.id,
      userName: r.adminName,
      action: r.action,
      module: 'Roles / Permissions',
      details: r.details || null,
      createdAt: r.createdAt,
    }));

    res.json({ logs, startDate, endDate });
  } catch (error) {
    console.error('getSystemChanges error:', error);
    res.status(500).json({ message: 'Failed to load system changes', error: error.message });
  }
};

exports.getDataModificationLogs = async (req, res) => {
  try {
    const { RoomBill, RestaurantBill } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);

    const dateFilter = getDateFilter(startDate, endDate);

    const [roomBills, restBills] = await Promise.all([
      RoomBill.findAll({
        where: { updatedAt: dateFilter },
        order: [['updatedAt', 'DESC']],
        limit: 200,
      }),
      RestaurantBill.findAll({
        where: { updatedAt: dateFilter },
        order: [['updatedAt', 'DESC']],
        limit: 200,
      }),
    ]);

    const logs = [];
    roomBills.forEach((b) => {
      logs.push({
        id: `room-${b.id}`,
        userName: b.updatedBy || 'System',
        module: 'RoomBill',
        action: 'Update',
        description: `Room bill ${b.billNumber || b.id} updated`,
        createdAt: b.updatedAt || b.createdAt,
      });
    });
    restBills.forEach((b) => {
      logs.push({
        id: `rest-${b.id}`,
        userName: b.updatedBy || 'System',
        module: 'RestaurantBill',
        action: 'Update',
        description: `Restaurant bill ${b.billNumber || b.id} updated`,
        createdAt: b.updatedAt || b.createdAt,
      });
    });

    logs.sort((a, b) => (b.createdAt || '').toString().localeCompare((a.createdAt || '').toString()));

    res.json({ logs, startDate, endDate });
  } catch (error) {
    console.error('getDataModificationLogs error:', error);
    res.status(500).json({ message: 'Failed to load data modification logs', error: error.message });
  }
};

exports.getRolePermissionLogs = async (req, res) => {
  try {
    const { startDate, endDate } = parseDateRange(req);
    const hotelId = req.hotel.id;

    const rows = await PermissionAudit.findAll({
      where: {
        hotelId,
        createdAt: getDateFilter(startDate, endDate),
      },
      order: [['createdAt', 'DESC']],
      limit: 200,
    });

    const logs = rows.map((r) => ({
      id: r.id,
      userName: r.adminName,
      action: r.action,
      details: r.details || null,
      createdAt: r.createdAt,
    }));

    res.json({ logs, startDate, endDate });
  } catch (error) {
    console.error('getRolePermissionLogs error:', error);
    res.status(500).json({ message: 'Failed to load role/permission logs', error: error.message });
  }
};

exports.getTransactionLogs = async (req, res) => {
  try {
    const { RoomBill, RestaurantBill, Payment, Refund } = req.hotelModels;
    const { startDate, endDate } = parseDateRange(req);
    const dateFilter = getDateFilter(startDate, endDate);

    const [roomBills, restBills, payments, refunds] = await Promise.all([
      RoomBill.findAll({
        where: { createdAt: dateFilter },
        order: [['createdAt', 'DESC']],
        limit: 100,
      }),
      RestaurantBill.findAll({
        where: { createdAt: dateFilter },
        order: [['createdAt', 'DESC']],
        limit: 100,
      }),
      Payment
        ? Payment.findAll({ where: { createdAt: dateFilter }, order: [['createdAt', 'DESC']], limit: 100 })
        : [],
      Refund
        ? Refund.findAll({ where: { createdAt: dateFilter }, order: [['createdAt', 'DESC']], limit: 100 })
        : [],
    ]);

    const logs = [];

    roomBills.forEach((b) => {
      logs.push({
        id: `room-${b.id}`,
        type: 'RoomBill',
        description: `Room bill ${b.billNumber || b.id}`,
        amount: parseFloat(b.grandTotal || 0),
        createdAt: b.createdAt,
      });
    });
    restBills.forEach((b) => {
      logs.push({
        id: `rest-${b.id}`,
        type: 'RestaurantBill',
        description: `Restaurant bill ${b.billNumber || b.id}`,
        amount: parseFloat(b.totalAmount || 0),
        createdAt: b.createdAt,
      });
    });
    (payments || []).forEach((p) => {
      logs.push({
        id: `pay-${p.id}`,
        type: 'Payment',
        description: p.description || 'Payment',
        amount: parseFloat(p.amount || 0),
        createdAt: p.createdAt,
      });
    });
    (refunds || []).forEach((r) => {
      logs.push({
        id: `ref-${r.id}`,
        type: 'Refund',
        description: r.reason || 'Refund',
        amount: parseFloat(r.amount || 0),
        createdAt: r.createdAt,
      });
    });

    logs.sort((a, b) => (b.createdAt || '').toString().localeCompare((a.createdAt || '').toString()));

    res.json({ logs, startDate, endDate });
  } catch (error) {
    console.error('getTransactionLogs error:', error);
    res.status(500).json({ message: 'Failed to load transaction logs', error: error.message });
  }
};

exports.exportAuditLogs = async (req, res) => {
  try {
    const { startDate, endDate } = parseDateRange(req);
    const hotelId = req.hotel.id;

    const [permLogs] = await Promise.all([
      PermissionAudit.findAll({
        where: {
          hotelId,
          createdAt: getDateFilter(startDate, endDate),
        },
        order: [['createdAt', 'DESC']],
        limit: 500,
      }),
    ]);

    const rolePermissionLogs = permLogs.map((r) => ({
      id: r.id,
      userName: r.adminName,
      action: r.action,
      details: r.details || null,
      createdAt: r.createdAt,
    }));

    res.json({
      filters: { startDate, endDate },
      rolePermissionLogs,
      // Other log types can be added later
    });
  } catch (error) {
    console.error('exportAuditLogs error:', error);
    res.status(500).json({ message: 'Failed to export audit logs', error: error.message });
  }
};

