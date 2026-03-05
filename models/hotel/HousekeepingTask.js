const { DataTypes } = require('sequelize');

/**
 * Housekeeping task model factory for hotel-specific schemas
 */
const createHousekeepingTaskModel = (sequelize, schemaName) => {
  return sequelize.define(
    'HousekeepingTask',
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
      housekeeper: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      cleaningType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      schedule: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('Pending', 'In Progress', 'Completed'),
        allowNull: false,
        defaultValue: 'Pending',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'housekeeping_tasks',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['roomNumber'] },
        { fields: ['status'] },
      ],
    }
  );
};

module.exports = createHousekeepingTaskModel;

