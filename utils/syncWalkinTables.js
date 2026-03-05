const { sequelize } = require('../config/database');
const createWalkinBookingModel = require('../models/hotel/WalkinBooking');

/**
 * Ensure walkin_bookings table exists for all existing hotel schemas.
 */
async function syncWalkinTables() {
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
        const WalkinBooking = createWalkinBookingModel(sequelize, schemaName);
        await WalkinBooking.sync({ alter: false });
      } catch (e) {
        console.warn(`[Migration] syncWalkinTables skipped schema "${schemaName}":`, e.message);
      }
    }
    console.log('[Migration] Walk-in tables synced for all hotel schemas');
  } catch (error) {
    console.warn('[Migration] syncWalkinTables failed:', error.message);
  }
}

module.exports = { syncWalkinTables };
