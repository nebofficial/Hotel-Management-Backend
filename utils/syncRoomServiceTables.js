const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

const createRoomServiceOrderModel = require('../models/hotel/RoomServiceOrder');

/**
 * Sync RoomServiceOrder tables for all existing hotel schemas
 */
async function syncRoomServiceTables() {
  try {
    const schemas = await sequelize.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'hotel_%'`,
      { type: QueryTypes.SELECT },
    );

    console.log(
      `Found ${schemas.length} hotel schemas to sync Room Service tables`,
    );

    for (const row of schemas) {
      const schemaName = row.schema_name;
      try {
        const RoomServiceOrder = createRoomServiceOrderModel(
          sequelize,
          schemaName,
        );
        await RoomServiceOrder.sync({ alter: false });
        console.log(`✓ Synced RoomServiceOrder tables for ${schemaName}`);
      } catch (error) {
        console.error(
          `✗ Failed to sync RoomServiceOrder tables for ${schemaName}:`,
          error.message,
        );
      }
    }

    console.log('RoomServiceOrder tables sync completed');
  } catch (error) {
    console.error('Error syncing RoomServiceOrder tables:', error);
  }
}

module.exports = syncRoomServiceTables;

