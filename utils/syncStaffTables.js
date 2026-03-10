const { sequelize } = require('../config/database');
const createStaffMemberModel = require('../models/hotel/StaffMember');
const createStaffScheduleModel = require('../models/hotel/StaffSchedule');
const createLeaveRequestModel = require('../models/hotel/LeaveRequest');
const createDepartmentModel = require('../models/hotel/Department');
const { QueryTypes } = require('sequelize');

/**
 * Sync StaffMember, StaffSchedule, LeaveRequest, and Department tables for all existing hotel schemas
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
        const LeaveRequest = createLeaveRequestModel(sequelize, schemaName);
        const Department = createDepartmentModel(sequelize, schemaName);
        await StaffMember.sync({ alter: false });
        await StaffSchedule.sync({ alter: false });
        await LeaveRequest.sync({ alter: false });
        await Department.sync({ alter: false });
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

