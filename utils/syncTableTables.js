const { sequelize } = require('../config/database');
const createRestaurantTableModel = require('../models/hotel/RestaurantTable');
const createTableReservationModel = require('../models/hotel/TableReservation');
const { QueryTypes } = require('sequelize');

/**
 * Sync RestaurantTable and TableReservation tables for all existing hotel schemas
 */
async function syncTableTables() {
  try {
    const schemas = await sequelize.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'hotel_%'`,
      { type: QueryTypes.SELECT }
    );

    console.log(`Found ${schemas.length} hotel schemas to sync Table tables`);

    for (const row of schemas) {
      const schemaName = row.schema_name;
      try {
        const RestaurantTable = createRestaurantTableModel(sequelize, schemaName);
        const TableReservation = createTableReservationModel(sequelize, schemaName);
        await RestaurantTable.sync({ alter: false });
        await TableReservation.sync({ alter: false });
        console.log(`✓ Synced Table tables for ${schemaName}`);
      } catch (error) {
        console.error(`✗ Failed to sync Table tables for ${schemaName}:`, error.message);
      }
    }

    console.log('Table tables sync completed');
  } catch (error) {
    console.error('Error syncing Table tables:', error);
  }
}

module.exports = syncTableTables;
