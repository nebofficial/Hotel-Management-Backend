const { DataTypes } = require('sequelize');

/**
 * DeliveryChargesConfig schema for hotel-specific data
 * Fixed / distance-based delivery charges
 */
const createDeliveryChargesConfigModel = (sequelize, schemaName) => {
  return sequelize.define(
    'DeliveryChargesConfig',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      chargeType: {
        type: DataTypes.ENUM('fixed', 'distance'),
        allowNull: false,
        defaultValue: 'fixed',
      },
      fixedAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      perKmRate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      freeDeliveryAbove: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'delivery_charges_config',
      schema: schemaName,
      timestamps: true,
      indexes: [{ fields: ['isActive'] }],
    },
  );
};

module.exports = createDeliveryChargesConfigModel;
