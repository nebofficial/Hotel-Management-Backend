const { DataTypes } = require('sequelize');

/**
 * Maintenance request model factory for hotel-specific schemas
 */
const createMaintenanceRequestModel = (sequelize, schemaName) => {
  return sequelize.define(
    'MaintenanceRequest',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      roomNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      issue: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      priority: {
        type: DataTypes.ENUM('Low', 'Medium', 'High'),
        allowNull: false,
        defaultValue: 'Medium',
      },
      status: {
        type: DataTypes.ENUM('Pending', 'In Progress', 'Resolved'),
        allowNull: false,
        defaultValue: 'Pending',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'maintenance_requests',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['roomNumber'] },
        { fields: ['status'] },
      ],
    }
  );
};

module.exports = createMaintenanceRequestModel;

