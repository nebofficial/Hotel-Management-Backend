const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

/**
 * Ensure newly added Rooms & Property tables exist for ALL existing hotel schemas.
 * This is needed because many schemas were created before these models existed.
 */
async function syncRoomsPropertyTables() {
  try {
    const schemas = await sequelize.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'hotel_%'`,
      { type: QueryTypes.SELECT }
    );

    if (!Array.isArray(schemas) || schemas.length === 0) return;

    const createHousekeepingTaskModel = require('../models/hotel/HousekeepingTask');
    const createMaintenanceRequestModel = require('../models/hotel/MaintenanceRequest');

    for (const row of schemas) {
      const schemaName = row && row.schema_name ? String(row.schema_name) : '';
      if (!schemaName) continue;

      try {
        const HousekeepingTask = createHousekeepingTaskModel(sequelize, schemaName);
        const MaintenanceRequest = createMaintenanceRequestModel(sequelize, schemaName);

        await HousekeepingTask.sync({ alter: false });
        await MaintenanceRequest.sync({ alter: false });
      } catch (e) {
        console.warn(`[Migration] syncRoomsPropertyTables skipped schema "${schemaName}":`, e.message);
      }
    }
  } catch (error) {
    console.warn('[Migration] syncRoomsPropertyTables failed:', error.message);
  }
}

module.exports = { syncRoomsPropertyTables };

