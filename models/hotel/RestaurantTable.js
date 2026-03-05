const { DataTypes } = require('sequelize');

/**
 * RestaurantTable schema factory for hotel-specific data
 * Manages restaurant tables with status, capacity, floor, waiter assignment, etc.
 */
const createRestaurantTableModel = (sequelize, schemaName) => {
  return sequelize.define(
    'RestaurantTable',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      tableNo: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      floor: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 2,
      },
      status: {
        type: DataTypes.ENUM('Available', 'Occupied', 'Reserved', 'Cleaning', 'Out of Service'),
        allowNull: false,
        defaultValue: 'Available',
      },
      currentGuestName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      currentGuestPhone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      assignedWaiterId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      assignedWaiterName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      positionX: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      positionY: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      qrCode: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      mergedWith: {
        // JSON array of table IDs if this table is merged
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'restaurant_tables',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['tableNo'] },
        { fields: ['status'] },
        { fields: ['floor'] },
        { fields: ['assignedWaiterId'] },
      ],
    },
  );
};

module.exports = createRestaurantTableModel;
