const { sequelize } = require('../config/database');
const createKitchenKOTModel = require('../models/hotel/KitchenKOT');
const { QueryTypes } = require('sequelize');

/**
 * Sync KitchenKOT tables for all existing hotel schemas
 */
async function syncKitchenKOTTables() {
  try {
    const schemas = await sequelize.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'hotel_%'`,
      { type: QueryTypes.SELECT }
    );

    console.log(`Found ${schemas.length} hotel schemas to sync Kitchen KOT tables`);

    for (const row of schemas) {
      const schemaName = row.schema_name;
      try {
        const KitchenKOT = createKitchenKOTModel(sequelize, schemaName);
        await KitchenKOT.sync({ alter: false });
        console.log(`✓ Synced Kitchen KOT tables for ${schemaName}`);
      } catch (error) {
        console.error(`✗ Failed to sync Kitchen KOT tables for ${schemaName}:`, error.message);
      }
    }

    console.log('Kitchen KOT tables sync completed');
  } catch (error) {
    console.error('Error syncing Kitchen KOT tables:', error);
  }
}

module.exports = syncKitchenKOTTables;
