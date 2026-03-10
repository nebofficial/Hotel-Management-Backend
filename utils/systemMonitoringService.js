const os = require('os');

function getSystemPerformanceSnapshot() {
  const load = os.loadavg?.() || [];
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  const cpuLoad = load[0] || 0;

  return {
    cpuLoad, // 1‑minute load average
    totalMem,
    freeMem,
    usedMem,
    uptimeSeconds: os.uptime(),
    nodeVersion: process.version,
  };
}

function getBackupStatusSnapshot() {
  // Placeholder implementation – in a real system, this would read
  // from backup logs or a backups table.
  const now = new Date();
  const lastBackup = new Date(now.getTime() - 6 * 60 * 60 * 1000); // 6h ago
  const nextBackup = new Date(now.getTime() + 18 * 60 * 60 * 1000); // in 18h

  return {
    lastBackupAt: lastBackup.toISOString(),
    nextBackupAt: nextBackup.toISOString(),
    status: "success",
  };
}

function getSystemUpdatesSnapshot() {
  // Stub – could be wired to a real updater later
  return {
    currentVersion: process.env.APP_VERSION || "1.0.0",
    updatesAvailable: true,
    items: [
      {
        id: "security-patch",
        type: "security",
        message: "Security patch available for authentication module.",
        severity: "high",
      },
      {
        id: "feature-release",
        type: "feature",
        message: "New analytics widgets available for the dashboard.",
        severity: "medium",
      },
    ],
  };
}

function getSupportTicketsSummary() {
  // Placeholder values – can be replaced with real ticket system integration
  return {
    totalOpen: 8,
    highPriority: 3,
    recentCreated: 5,
  };
}

function getSystemActivityFeed() {
  const now = Date.now();
  const mk = (minsAgo, message) => ({
    id: `${minsAgo}-${message.slice(0, 8)}`,
    message,
    createdAt: new Date(now - minsAgo * 60 * 1000).toISOString(),
  });

  return [
    mk(5, "Admin updated tax settings for Hotel Sunrise"),
    mk(18, "Backup completed successfully for Hotel Lakeview"),
    mk(43, "New staff role 'Front Desk Manager' created"),
    mk(95, "Integration settings updated for Stripe gateway"),
  ];
}

function getUsageAnalyticsSnapshot() {
  // Simple synthetic data for charts
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  });

  return {
    dailyUsage: days.map((date, idx) => ({
      date,
      activeUsers: 40 + idx * 5,
      apiRequests: 800 + idx * 120,
    })),
    featureUsage: [
      { feature: "Reservations", value: 42 },
      { feature: "Billing", value: 28 },
      { feature: "Restaurant POS", value: 18 },
      { feature: "Reports", value: 12 },
    ],
  };
}

module.exports = {
  getSystemPerformanceSnapshot,
  getBackupStatusSnapshot,
  getSystemUpdatesSnapshot,
  getSupportTicketsSummary,
  getSystemActivityFeed,
  getUsageAnalyticsSnapshot,
};

