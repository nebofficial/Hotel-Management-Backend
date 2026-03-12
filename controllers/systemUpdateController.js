const {
  checkForUpdates,
  installUpdate,
  fetchUpdateHistory,
  applySecurityPatch,
  restartSystem,
} = require("../utils/updateService");

exports.checkForUpdates = async (req, res) => {
  try {
    const data = await checkForUpdates();
    res.json(data);
  } catch (error) {
    console.error("systemUpdates.checkForUpdates error:", error);
    res
      .status(error.status || 500)
      .json({ message: "Failed to check for updates", error: error.message });
  }
};

exports.installUpdate = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ message: "Update id is required" });
    }
    const result = await installUpdate(id);
    res.json(result);
  } catch (error) {
    console.error("systemUpdates.installUpdate error:", error);
    res
      .status(error.status || 500)
      .json({ message: "Failed to install update", error: error.message });
  }
};

exports.fetchUpdateHistory = async (req, res) => {
  try {
    const history = await fetchUpdateHistory();
    res.json(history);
  } catch (error) {
    console.error("systemUpdates.fetchUpdateHistory error:", error);
    res
      .status(error.status || 500)
      .json({ message: "Failed to load update history", error: error.message });
  }
};

exports.applySecurityPatch = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ message: "Patch id is required" });
    }
    const result = await applySecurityPatch(id);
    res.json(result);
  } catch (error) {
    console.error("systemUpdates.applySecurityPatch error:", error);
    res
      .status(error.status || 500)
      .json({ message: "Failed to apply security patch", error: error.message });
  }
};

exports.restartSystem = async (req, res) => {
  try {
    const { mode, scheduledFor } = req.body || {};
    const result = await restartSystem({ mode, scheduledFor });
    res.json(result);
  } catch (error) {
    console.error("systemUpdates.restartSystem error:", error);
    res
      .status(error.status || 500)
      .json({ message: "Failed to restart system", error: error.message });
  }
};

