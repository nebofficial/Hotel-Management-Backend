const { sequelize } = require('../config/database');
const createGroupBookingModel = require('../models/hotel/GroupBooking');

/**
 * Ensure group_bookings table exists for all existing hotel schemas.
 */
async function syncGroupBookingTables() {
  try {
    const { QueryTypes } = require('sequelize');
    const schemas = await sequelize.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'hotel_%'`,
      { type: QueryTypes.SELECT }
    );

    if (!Array.isArray(schemas) || schemas.length === 0) return;

    for (const row of schemas) {
      const schemaName = row && row.schema_name ? String(row.schema_name) : '';
      if (!schemaName) continue;

      try {
        const GroupBooking = createGroupBookingModel(sequelize, schemaName);
        await GroupBooking.sync({ alter: false });
      } catch (e) {
        console.warn(`[Migration] syncGroupBookingTables skipped schema "${schemaName}":`, e.message);
      }
    }
  } catch (error) {
    console.warn('[Migration] syncGroupBookingTables failed:', error.message);
  }
}

module.exports = { syncGroupBookingTables };
