const { DataTypes } = require('sequelize');

/**
 * BarOrder schema factory for hotel-specific data
 * Stores Bar Order Tracking (BOT) orders and statuses
 */
const createBarOrderModel = (sequelize, schemaName) => {
  return sequelize.define(
    'BarOrder',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      orderNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      location: {
        // e.g., "Bar-01", "Pool Bar", "Lounge"
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Bar',
      },
      items: {
        // JSON array: [{ id, name, quantity, isAlcohol, basePrice, size, unitPrice, status }]
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      status: {
        type: DataTypes.ENUM('Pending', 'Mixing', 'Ready', 'Served', 'Cancelled'),
        allowNull: false,
        defaultValue: 'Pending',
      },
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      happyHourApplied: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      happyHourDiscount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      ageVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'bar_orders',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['orderNumber'] },
        { fields: ['status'] },
        { fields: ['location'] },
        { fields: ['createdAt'] },
      ],
    },
  );
};

module.exports = createBarOrderModel;

