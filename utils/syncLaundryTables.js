const { sequelize } = require('../config/database');
const createLaundryTaskModel = require('../models/hotel/LaundryTask');
const { QueryTypes } = require('sequelize');

/**
 * Sync LaundryTask tables for all existing hotel schemas
 * This ensures backward compatibility when adding the LaundryTask model
 */
async function syncLaundryTables() {
  try {
    // Get all hotel schemas
    const schemas = await sequelize.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'hotel_%'`,
      { type: QueryTypes.SELECT }
    );

    console.log(`Found ${schemas.length} hotel schemas to sync LaundryTask tables`);

    for (const row of schemas) {
      const schemaName = row.schema_name;
      try {
        const LaundryTask = createLaundryTaskModel(sequelize, schemaName);
        await LaundryTask.sync({ alter: false });
        console.log(`✓ Synced LaundryTask table for ${schemaName}`);
      } catch (error) {
        console.error(`✗ Failed to sync LaundryTask for ${schemaName}:`, error.message);
      }
    }

    console.log('LaundryTask table sync completed');
  } catch (error) {
    console.error('Error syncing LaundryTask tables:', error);
  }
}

module.exports = syncLaundryTables;
