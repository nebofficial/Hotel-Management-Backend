const {
  getCurrentVersion,
  getLatestVersion,
  listAvailableUpdates,
  listSecurityPatches,
  markUpdateInstalled,
  markPatchApplied,
} = require("./versionManager");
const SystemUpdate = require("../models/SystemUpdate");

function buildNotifications({ hasUpdate, patches }) {
  const notifications = [];

  if (hasUpdate) {
    const latest = getLatestVersion();
    notifications.push({
      id: `notif-update-${latest.version}`,
      type: "update",
      title: `New version ${latest.version} available`,
      message:
        latest.notes ||
        "A newer version of the hotel management system is ready to install.",
      severity: "info",
    });
  }

  for (const patch of patches) {
    if (patch.status === "available") {
      notifications.push({
        id: `notif-patch-${patch.id}`,
        type: "security",
        title: patch.title,
        message: patch.notes,
        severity: patch.severity || "critical",
        code: patch.code,
      });
    }
  }

  return notifications;
}

async function checkForUpdates() {
  const currentVersion = getCurrentVersion();
  const latestVersion = getLatestVersion();
  const availableUpdates = listAvailableUpdates();
  const patches = listSecurityPatches();

  const hasUpdate =
    latestVersion.version && latestVersion.version !== currentVersion.version;

  const notifications = buildNotifications({ hasUpdate, patches });

  return {
    currentVersion,
    latestVersion,
    hasUpdate,
    availableUpdates,
    securityPatches: patches,
    notifications,
  };
}

async function installUpdate(id) {
  const installed = markUpdateInstalled(id);
  if (!installed) {
    const error = new Error("Update not found");
    error.status = 404;
    throw error;
  }

  const historyEntry = SystemUpdate.addUpdateHistory({
    id: installed.id,
    version: installed.version,
    type: installed.type || "feature",
    title: installed.title,
    status: "installed",
    installedAt: installed.installedAt,
    notes: installed.notes,
  });

  return {
    installedUpdate: installed,
    historyEntry,
  };
}

async function fetchUpdateHistory() {
  return {
    items: SystemUpdate.getUpdateHistory(),
  };
}

async function applySecurityPatch(id) {
  const applied = markPatchApplied(id);
  if (!applied) {
    const error = new Error("Security patch not found");
    error.status = 404;
    throw error;
  }

  const historyEntry = SystemUpdate.addUpdateHistory({
    id: applied.id,
    version: getCurrentVersion().version,
    type: "security",
    title: applied.title,
    status: "installed",
    installedAt: applied.installedAt,
    notes: applied.notes,
  });

  return {
    appliedPatch: applied,
    historyEntry,
  };
}

async function restartSystem({ mode, scheduledFor }) {
  const now = new Date().toISOString();
  if (mode === "schedule" && !scheduledFor) {
    const error = new Error("scheduledFor is required when mode is 'schedule'");
    error.status = 400;
    throw error;
  }

  // This is only a stub; no real restart is triggered.
  return {
    mode: mode || "now",
    scheduledFor: mode === "schedule" ? scheduledFor : now,
    message:
      mode === "schedule"
        ? "System restart scheduled (simulation only)."
        : "System restart would be triggered now (simulation only).",
    acknowledgedAt: now,
  };
}

module.exports = {
  checkForUpdates,
  installUpdate,
  fetchUpdateHistory,
  applySecurityPatch,
  restartSystem,
};

