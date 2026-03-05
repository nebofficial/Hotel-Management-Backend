const { sequelize } = require('../config/database');
const createStaffMemberModel = require('../models/hotel/StaffMember');
const createStaffScheduleModel = require('../models/hotel/StaffSchedule');
const { QueryTypes } = require('sequelize');

/**
 * Sync StaffMember and StaffSchedule tables for all existing hotel schemas
 * This keeps staff-assignment related tables in sync across older hotel schemas.
 */
async function syncStaffTables() {
  try {
    const schemas = await sequelize.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'hotel_%'`,
      { type: QueryTypes.SELECT }
    );

    console.log(`Found ${schemas.length} hotel schemas to sync Staff tables`);

    for (const row of schemas) {
      const schemaName = row.schema_name;
      try {
        const StaffMember = createStaffMemberModel(sequelize, schemaName);
        const StaffSchedule = createStaffScheduleModel(sequelize, schemaName);
        await StaffMember.sync({ alter: false });
        await StaffSchedule.sync({ alter: false });
        console.log(`✓ Synced Staff tables for ${schemaName}`);
      } catch (error) {
        console.error(`✗ Failed to sync Staff tables for ${schemaName}:`, error.message);
      }
    }

    console.log('Staff tables sync completed');
  } catch (error) {
    console.error('Error syncing Staff tables:', error);
  }
}

module.exports = syncStaffTables;

