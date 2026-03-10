const express = require('express');
const { queryLogs, toExportRows } = require('../utils/logService');

const router = express.Router();

function parseFilters(query) {
  const { user, module, type, startDate, endDate } = query;
  return {
    user,
    module,
    type,
    startDate,
    endDate,
  };
}

router.get('/', async (req, res) => {
  try {
    const filters = parseFilters(req.query);
    const logs = await queryLogs(filters, 200);
    res.json({ items: logs });
  } catch (error) {
    console.error('activityLogs.list error:', error);
    res.status(500).json({ message: 'Failed to load activity logs', error: error.message });
  }
});

router.get('/logins', async (req, res) => {
  try {
    const filters = { ...parseFilters(req.query), type: 'login' };
    const logs = await queryLogs(filters, 200);
    res.json({ items: logs });
  } catch (error) {
    console.error('activityLogs.logins error:', error);
    res.status(500).json({ message: 'Failed to load login logs', error: error.message });
  }
});

router.get('/errors', async (req, res) => {
  try {
    const filters = { ...parseFilters(req.query), type: 'error' };
    const logs = await queryLogs(filters, 200);
    res.json({ items: logs });
  } catch (error) {
    console.error('activityLogs.errors error:', error);
    res.status(500).json({ message: 'Failed to load error logs', error: error.message });
  }
});

router.get('/export', async (req, res) => {
  try {
    const filters = parseFilters(req.query);
    const logs = await queryLogs(filters, 1000);
    const rows = toExportRows(logs);
    const format = (req.query.format || 'csv').toString().toLowerCase();
    res.json({
      format,
      generatedAt: new Date().toISOString(),
      rows,
    });
  } catch (error) {
    console.error('activityLogs.export error:', error);
    res.status(500).json({ message: 'Failed to export logs', error: error.message });
  }
});

module.exports = router;

