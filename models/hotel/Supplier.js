const { DataTypes } = require('sequelize');

/**
 * Supplier schema factory for hotel-specific data
 * Manages supplier information for inventory purchases
 */
const createSupplierModel = (sequelize, schemaName) => {
  return sequelize.define(
    'Supplier',
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
      contactPerson: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      paymentTerms: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      gstNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bankName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bankAccountNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bankIFSC: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bankBranch: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      rating: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true,
      },
      totalPurchases: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      outstandingAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'suppliers',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['name'] },
        { fields: ['isActive'] },
        { fields: ['createdAt'] },
      ],
    },
  );
};

module.exports = createSupplierModel;
