const express = require('express');
const {
  getSystemPerformanceSnapshot,
  getBackupStatusSnapshot,
  getSystemUpdatesSnapshot,
  getSupportTicketsSummary,
  getSystemActivityFeed,
  getUsageAnalyticsSnapshot,
} = require('../utils/systemMonitoringService');

const router = express.Router();

// System performance (CPU, memory, uptime)
router.get('/health', (req, res) => {
  try {
    const data = getSystemPerformanceSnapshot();
    res.json(data);
  } catch (error) {
    console.error('helpSystem.health error:', error);
    res.status(500).json({ message: 'Failed to load system health', error: error.message });
  }
});

// Support ticket summary (placeholder)
router.get('/support-tickets', (req, res) => {
  try {
    const data = getSupportTicketsSummary();
    res.json(data);
  } catch (error) {
    console.error('helpSystem.supportTickets error:', error);
    res.status(500).json({ message: 'Failed to load support tickets', error: error.message });
  }
});

// Backup status
router.get('/backup-status', (req, res) => {
  try {
    const data = getBackupStatusSnapshot();
    res.json(data);
  } catch (error) {
    console.error('helpSystem.backupStatus error:', error);
    res.status(500).json({ message: 'Failed to load backup status', error: error.message });
  }
});

// System update notifications
router.get('/system-updates', (req, res) => {
  try {
    const data = getSystemUpdatesSnapshot();
    res.json(data);
  } catch (error) {
    console.error('helpSystem.systemUpdates error:', error);
    res.status(500).json({ message: 'Failed to load system updates', error: error.message });
  }
});

// Recent support / system activity feed
router.get('/recent-activity', (req, res) => {
  try {
    const items = getSystemActivityFeed();
    res.json({ items });
  } catch (error) {
    console.error('helpSystem.recentActivity error:', error);
    res.status(500).json({ message: 'Failed to load recent activity', error: error.message });
  }
});

// Usage analytics (charts)
router.get('/usage-analytics', (req, res) => {
  try {
    const data = getUsageAnalyticsSnapshot();
    res.json(data);
  } catch (error) {
    console.error('helpSystem.usageAnalytics error:', error);
    res.status(500).json({ message: 'Failed to load usage analytics', error: error.message });
  }
});

module.exports = router;

