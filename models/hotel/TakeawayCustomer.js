const { DataTypes } = require('sequelize');

/**
 * TakeawayCustomer schema for hotel-specific data
 * Store & retrieve customer details for takeaway/delivery
 */
const createTakeawayCustomerModel = (sequelize, schemaName) => {
  return sequelize.define(
    'TakeawayCustomer',
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
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      pincode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'takeaway_customers',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['name'] },
        { fields: ['phone'] },
        { fields: ['email'] },
      ],
    },
  );
};

module.exports = createTakeawayCustomerModel;
