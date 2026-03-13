const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const createRoomBillModel = require('../models/hotel/RoomBill');

async function syncRoomBillTables() {
  try {
    const schemas = await sequelize.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'hotel_%'`,
      { type: QueryTypes.SELECT },
    );

    for (const row of schemas) {
      const schemaName = row.schema_name;
      try {
        const RoomBill = createRoomBillModel(sequelize, schemaName);
        await RoomBill.sync({ alter: false });
        console.log(`✓ Synced RoomBill table for ${schemaName}`);
      } catch (error) {
        console.error(`✗ Failed to sync RoomBill for ${schemaName}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error syncing RoomBill tables:', error);
  }
}

module.exports = { syncRoomBillTables };

