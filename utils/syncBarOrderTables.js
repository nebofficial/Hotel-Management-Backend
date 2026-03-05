const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

const createBarOrderModel = require('../models/hotel/BarOrder');
const createBarInventoryItemModel = require('../models/hotel/BarInventoryItem');

/**
 * Sync Bar Order Tracking tables for all existing hotel schemas
 */
async function syncBarOrderTables() {
  try {
    const schemas = await sequelize.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'hotel_%'`,
      { type: QueryTypes.SELECT },
    );

    console.log(`Found ${schemas.length} hotel schemas to sync Bar Order Tracking tables`);

    for (const row of schemas) {
      const schemaName = row.schema_name;
      try {
        const BarOrder = createBarOrderModel(sequelize, schemaName);
        const BarInventoryItem = createBarInventoryItemModel(sequelize, schemaName);
        await BarOrder.sync({ alter: false });
        await BarInventoryItem.sync({ alter: false });
        console.log(`✓ Synced Bar Order Tracking tables for ${schemaName}`);
      } catch (error) {
        console.error(
          `✗ Failed to sync Bar Order Tracking tables for ${schemaName}:`,
          error.message,
        );
      }
    }

    console.log('Bar Order Tracking tables sync completed');
  } catch (error) {
    console.error('Error syncing Bar Order Tracking tables:', error);
  }
}

module.exports = syncBarOrderTables;

