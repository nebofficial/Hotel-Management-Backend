const { DataTypes } = require('sequelize');

/**
 * DeliveryArea schema for hotel-specific data
 * Manage serviceable delivery areas (pincode / zone-based)
 */
const createDeliveryAreaModel = (sequelize, schemaName) => {
  return sequelize.define(
    'DeliveryArea',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      pincode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      zoneName: {
        type: DataTypes.STRING,
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
      tableName: 'delivery_areas',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['pincode'] },
        { fields: ['zoneName'] },
        { fields: ['isActive'] },
      ],
    },
  );
};

module.exports = createDeliveryAreaModel;
