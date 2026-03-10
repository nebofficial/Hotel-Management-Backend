const os = require('os');
const { Op } = require('sequelize');
const { User } = require('../models');
const PermissionAudit = require('../models/PermissionAudit');

function parseDateRange(req) {
  const start = req.query.startDate || null;
  const end = req.query.endDate || null;
  const endDate = end ? new Date(end) : new Date();
  const startDate = start
    ? new Date(start)
    : new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  return {
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10),
  };
}

exports.getOverview = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isActive: true } });

    const planIntegrations = process.env.ACTIVE_INTEGRATIONS || '';
    const activeIntegrations = planIntegrations
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean).length;

    // Simple derived values; you can replace with real metrics later
    const activeSessions = 0;
    const systemStatus = 'OK';

    res.json({
      totalUsers,
      activeUsers,
      activeIntegrations,
      activeSessions,
      systemStatus,
    });
  } catch (error) {
    console.error('settingsDashboard.getOverview error:', error);
    res.status(500).json({ message: 'Failed to load settings overview', error: error.message });
  }
};

exports.getSystemHealth = async (req, res) => {
  try {
    const load = os.loadavg?.() || [];
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const uptimeSeconds = os.uptime();

    res.json({
      cpuLoad: load[0] || 0,
      totalMem,
      freeMem,
      usedMem,
      uptimeSeconds,
      nodeVersion: process.version,
    });
  } catch (error) {
    console.error('settingsDashboard.getSystemHealth error:', error);
    res.status(500).json({ message: 'Failed to load system health', error: error.message });
  }
};

exports.getRecentConfigActivity = async (req, res) => {
  try {
    const { startDate, endDate } = parseDateRange(req);
    const rows = await PermissionAudit.findAll({
      where: {
        createdAt: {
          [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')],
        },
      },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    const items = rows.map((r) => ({
      id: r.id,
      adminName: r.adminName,
      action: r.action,
      details: r.details || null,
      createdAt: r.createdAt,
    }));

    res.json({ items, startDate, endDate });
  } catch (error) {
    console.error('settingsDashboard.getRecentConfigActivity error:', error);
    res.status(500).json({ message: 'Failed to load configuration activity', error: error.message });
  }
};

