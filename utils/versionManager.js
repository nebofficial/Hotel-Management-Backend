// Simple in-memory version manager for the System Updates module.
// In a real deployment this would likely read from a database or
// configuration service. For now we simulate a few updates.

const CURRENT_VERSION = {
  version: "1.2.0",
  build: "2025.10.01-001",
  releasedAt: "2025-10-01T00:00:00.000Z",
};

let availableUpdates = [
  {
    id: "update-1.3.0",
    version: "1.3.0",
    type: "feature",
    title: "Performance & Reporting Update",
    releasedAt: "2025-12-15T00:00:00.000Z",
    notes:
      "Includes faster dashboards, improved reporting, and minor UX improvements.",
    status: "available",
  },
];

let securityPatches = [
  {
    id: "patch-2026-01",
    code: "HMS-SEC-2026-01",
    severity: "critical",
    title: "Security hardening for authentication module",
    releasedAt: "2026-01-10T00:00:00.000Z",
    notes:
      "Improves password hashing configuration and adds additional token validation checks.",
    status: "available",
  },
];

function getCurrentVersion() {
  return { ...CURRENT_VERSION };
}

function getLatestVersion() {
  if (!availableUpdates.length) {
    return { ...CURRENT_VERSION };
  }
  // Assuming first element is the latest
  return { ...availableUpdates[0] };
}

function listAvailableUpdates() {
  return availableUpdates.map((u) => ({ ...u }));
}

function listSecurityPatches() {
  return securityPatches.map((p) => ({ ...p }));
}

function markUpdateInstalled(id) {
  const idx = availableUpdates.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  const update = availableUpdates[idx];
  availableUpdates.splice(idx, 1);

  // Bump current version to this update's version/build.
  CURRENT_VERSION.version = update.version;
  CURRENT_VERSION.build = `build-${update.version}`;
  CURRENT_VERSION.releasedAt = new Date().toISOString();

  return {
    ...update,
    status: "installed",
    installedAt: new Date().toISOString(),
  };
}

function markPatchApplied(id) {
  const idx = securityPatches.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const patch = securityPatches[idx];
  securityPatches[idx] = {
    ...patch,
    status: "installed",
    installedAt: new Date().toISOString(),
  };
  return securityPatches[idx];
}

module.exports = {
  getCurrentVersion,
  getLatestVersion,
  listAvailableUpdates,
  listSecurityPatches,
  markUpdateInstalled,
  markPatchApplied,
};

