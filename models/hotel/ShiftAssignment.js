const { DataTypes } = require('sequelize');

/**
 * ShiftAssignment schema - staff assigned to shifts for specific dates
 */
const createShiftAssignmentModel = (sequelize, schemaName) => {
  return sequelize.define(
    'ShiftAssignment',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      staffId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      staffName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      shiftId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      shiftName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      overtimeMinutes: {
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
      tableName: 'shift_assignments',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['date'] },
        { fields: ['staffId'] },
        { fields: ['shiftId'] },
        { unique: true, fields: ['staffId', 'date'] },
      ],
    }
  );
};

module.exports = createShiftAssignmentModel;
