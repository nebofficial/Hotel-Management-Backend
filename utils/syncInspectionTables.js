const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

/**
 * Ensure Inspection tables exist for ALL existing hotel schemas.
 * This is needed because some schemas may have been created before the model existed.
 */
async function syncInspectionTables() {
  try {
    const schemas = await sequelize.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'hotel_%'`,
      { type: QueryTypes.SELECT }
    );

    if (!Array.isEmpty && (!schemas || schemas.length === 0)) return;

    const createInspectionModel = require('../models/hotel/Inspection');

    for (const row of schemas) {
      const schemaName = row && row.schema_name ? String(row.schema_name) : '';
      if (!schemaName) continue;

      try {
        const Inspection = createInspectionModel(sequelize, schemaName);
        await Inspection.sync({ alter: false });
      } catch (e) {
        console.warn(
          `[Migration] syncInspectionTables skipped schema "${schemaName}":`,
          e.message
        );
      }
    }
  } catch (error) {
    console.warn('[Migration] syncInspectionTables failed:', error.message);
  }
}

module.exports = { syncInspectionTables };

