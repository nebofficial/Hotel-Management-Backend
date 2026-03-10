const { Op } = require('sequelize');
const ActivityLog = require('../models/ActivityLog');

function buildWhere(filters = {}) {
  const where = {};
  const { user, module, type, startDate, endDate } = filters;

  if (user) {
    where.userName = { [Op.iLike]: `%${user}%` };
  }
  if (module) {
    where.module = { [Op.iLike]: `%${module}%` };
  }
  if (type && type !== 'all') {
    where.type = type;
  }
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt[Op.gte] = new Date(startDate);
    if (endDate) where.createdAt[Op.lte] = new Date(endDate + 'T23:59:59');
  }

  return where;
}

async function ensureSampleData() {
  const count = await ActivityLog.count();
  if (count > 0) return;

  const now = new Date();
  const mk = (minutesAgo, extra) => ({
    createdAt: new Date(now.getTime() - minutesAgo * 60 * 1000),
    updatedAt: new Date(now.getTime() - minutesAgo * 60 * 1000),
    ...extra,
  });

  await ActivityLog.bulkCreate([
    mk(5, {
      type: 'login',
      module: 'Auth',
      action: 'User logged in',
      userName: 'Front Desk',
      ipAddress: '192.168.1.10',
    }),
    mk(12, {
      type: 'config',
      module: 'Settings',
      action: 'Updated tax configuration',
      userName: 'Admin',
    }),
    mk(30, {
      type: 'data',
      module: 'Reservations',
      action: 'Created reservation #RV-1023',
      userName: 'Front Desk',
    }),
    mk(45, {
      type: 'module',
      module: 'Reports',
      action: 'Viewed revenue report',
      userName: 'Manager',
    }),
    mk(60, {
      type: 'error',
      module: 'POS',
      action: 'Payment gateway timeout',
      userName: 'POS Terminal',
    }),
  ]);
}

async function queryLogs(filters = {}, limit = 200) {
  await ActivityLog.sync();
  await ensureSampleData();
  const where = buildWhere(filters);
  return ActivityLog.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
  });
}

function toExportRows(logs) {
  return logs.map((log) => ({
    Timestamp: log.createdAt.toISOString(),
    User: log.userName || '',
    Type: log.type,
    Module: log.module || '',
    Action: log.action,
    IP: log.ipAddress || '',
  }));
}

module.exports = {
  buildWhere,
  queryLogs,
  toExportRows,
};

