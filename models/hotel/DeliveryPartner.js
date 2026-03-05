const { DataTypes } = require('sequelize');

/**
 * DeliveryPartner schema for hotel-specific data
 * Assign rider & track availability
 */
const createDeliveryPartnerModel = (sequelize, schemaName) => {
  return sequelize.define(
    'DeliveryPartner',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isAvailable: {
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
      tableName: 'delivery_partners',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['name'] },
        { fields: ['isAvailable'] },
      ],
    },
  );
};

module.exports = createDeliveryPartnerModel;
