const { DataTypes } = require('sequelize');

const createAttendanceModel = (sequelize, schemaName) => {
  return sequelize.define(
    'Attendance',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      staffId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      staffName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      department: {
        type: DataTypes.STRING,
        allowNull: true,
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
      status: {
        type: DataTypes.ENUM('Present', 'Absent', 'Late', 'Early Exit'),
        allowNull: false,
        defaultValue: 'Present',
      },
      checkInTime: {
        type: DataTypes.STRING(8), // HH:mm
        allowNull: true,
      },
      checkOutTime: {
        type: DataTypes.STRING(8),
        allowNull: true,
      },
      workHours: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0,
      },
      lateMinutes: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      earlyMinutes: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'attendance_records',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['date'] },
        { fields: ['staffId'] },
        { fields: ['status'] },
        { fields: ['department'] },
      ],
    },
  );
};

module.exports = createAttendanceModel;

