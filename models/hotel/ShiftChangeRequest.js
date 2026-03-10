const { DataTypes } = require('sequelize');

/**
 * ShiftChangeRequest schema - staff requests to change shifts
 */
const createShiftChangeRequestModel = (sequelize, schemaName) => {
  return sequelize.define(
    'ShiftChangeRequest',
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
      currentShiftId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      currentShiftName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      currentDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      requestedShiftId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      requestedShiftName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      requestedDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      approvedBy: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'shift_change_requests',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['status'] },
        { fields: ['staffId'] },
        { fields: ['currentDate'] },
      ],
    }
  );
};

module.exports = createShiftChangeRequestModel;
