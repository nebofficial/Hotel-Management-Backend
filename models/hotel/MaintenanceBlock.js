const { DataTypes } = require('sequelize');

/**
 * MaintenanceBlock schema for blocking rooms on the calendar.
 * Stored in each hotel's separate schema.
 */
const createMaintenanceBlockModel = (sequelize, schemaName) => {
  return sequelize.define(
    'MaintenanceBlock',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      roomId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      roomNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      roomType: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      reason: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      type: {
        // e.g. 'plumbing', 'electrical', 'deep_cleaning', 'renovation', etc.
        type: DataTypes.STRING,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: 'maintenance_blocks',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['roomId'] },
        { fields: ['roomNumber'] },
        { fields: ['startDate', 'endDate'] },
        { fields: ['isActive'] },
      ],
    }
  );
};

module.exports = createMaintenanceBlockModel;

