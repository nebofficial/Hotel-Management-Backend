// Lightweight in-memory model for system update history.
// This does not persist to the database; it is a simple placeholder
// so the frontend can work end-to-end until a real persistence layer is added.

let updateHistory = [
  {
    id: "init-1.2.0",
    version: "1.2.0",
    type: "feature",
    title: "Initial production release",
    status: "installed",
    installedAt: new Date().toISOString(),
    notes: "Base hotel management system deployed.",
  },
];

function getUpdateHistory() {
  // Return newest first
  return updateHistory
    .slice()
    .sort((a, b) => new Date(b.installedAt) - new Date(a.installedAt));
}

function addUpdateHistory(entry) {
  const item = {
    id: entry.id || `hist-${Date.now()}`,
    version: entry.version,
    type: entry.type || "feature",
    title: entry.title || entry.version || "System Update",
    status: entry.status || "installed",
    installedAt: entry.installedAt || new Date().toISOString(),
    notes: entry.notes || "",
  };
  updateHistory.unshift(item);
  return item;
}

module.exports = {
  getUpdateHistory,
  addUpdateHistory,
};

