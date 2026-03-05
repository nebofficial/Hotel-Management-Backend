const { sequelize } = require('../config/database');
const createLinenItemModel = require('../models/hotel/LinenItem');
const createLinenUsageModel = require('../models/hotel/LinenUsage');
const { QueryTypes } = require('sequelize');

/**
 * Sync LinenItem and LinenUsage tables for all existing hotel schemas
 */
async function syncLinenTables() {
  try {
    const schemas = await sequelize.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'hotel_%'`,
      { type: QueryTypes.SELECT }
    );

    console.log(`Found ${schemas.length} hotel schemas to sync Linen tables`);

    for (const row of schemas) {
      const schemaName = row.schema_name;
      try {
        const LinenItem = createLinenItemModel(sequelize, schemaName);
        const LinenUsage = createLinenUsageModel(sequelize, schemaName);
        await LinenItem.sync({ alter: false });
        await LinenUsage.sync({ alter: false });
        console.log(`✓ Synced Linen tables for ${schemaName}`);
      } catch (error) {
        console.error(`✗ Failed to sync Linen tables for ${schemaName}:`, error.message);
      }
    }

    console.log('Linen table sync completed');
  } catch (error) {
    console.error('Error syncing Linen tables:', error);
  }
}

module.exports = syncLinenTables;
