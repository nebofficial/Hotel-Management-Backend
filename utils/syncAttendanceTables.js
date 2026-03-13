const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const createAttendanceModel = require('../models/hotel/Attendance');

async function syncAttendanceTables() {
  try {
    const schemas = await sequelize.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'hotel_%'`,
      { type: QueryTypes.SELECT },
    );

    for (const row of schemas) {
      const schemaName = row.schema_name;
      try {
        const Attendance = createAttendanceModel(sequelize, schemaName);
        await Attendance.sync({ alter: false });
        console.log(`✓ Synced Attendance table for ${schemaName}`);
      } catch (error) {
        console.error(`✗ Failed to sync Attendance for ${schemaName}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error syncing Attendance tables:', error);
  }
}

module.exports = { syncAttendanceTables };

