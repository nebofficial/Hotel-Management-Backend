const { DataTypes } = require('sequelize');

/**
 * StaffSchedule schema factory for hotel-specific data
 * Tracks shifts, workload, attendance, and performance per staff per day
 */
const createStaffScheduleModel = (sequelize, schemaName) => {
  return sequelize.define(
    'StaffSchedule',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      staffId: {
        // References StaffMember.id (soft reference, no FK constraint for simplicity)
        type: DataTypes.UUID,
        allowNull: false,
      },
      staffName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      shift: {
        type: DataTypes.ENUM('Morning', 'Afternoon', 'Night'),
        allowNull: false,
        defaultValue: 'Morning',
      },
      role: {
        type: DataTypes.ENUM('Housekeeping', 'Laundry', 'Inspector', 'Supervisor', 'Other'),
        allowNull: false,
        defaultValue: 'Housekeeping',
      },
      assignedRooms: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      assignedTasks: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      workloadScore: {
        // Generic score used for balancing
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      attendanceStatus: {
        type: DataTypes.ENUM('Present', 'Absent', 'On Leave', 'Off'),
        allowNull: false,
        defaultValue: 'Present',
      },
      hoursWorked: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      overtimeHours: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      performanceScore: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      inspectionsPassed: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      inspectionsFailed: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'staff_schedules',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['date'] },
        { fields: ['shift'] },
        { fields: ['staffId'] },
        { fields: ['attendanceStatus'] },
      ],
    },
  );
};

module.exports = createStaffScheduleModel;

