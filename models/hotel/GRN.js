const { DataTypes } = require('sequelize');

/**
 * GRN (Goods Receipt Note) schema factory for hotel-specific data
 * Tracks goods received from purchase orders
 */
const createGRNModel = (sequelize, schemaName) => {
  return sequelize.define(
    'GRN',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      grnNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      purchaseOrderId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      supplierId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      receivedDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      status: {
        type: DataTypes.ENUM('Draft', 'Pending', 'Verified', 'Approved', 'Rejected'),
        allowNull: false,
        defaultValue: 'Draft',
      },
      receivedItems: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
        // Structure: [{ itemId, itemName, orderedQty, receivedQty, acceptedQty, rejectedQty, damagedQty, unitPrice, batchNumber, expiryDate, condition, notes }]
      },
      totalItems: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      totalAcceptedItems: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      totalRejectedItems: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      verifiedBy: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      verifiedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      approvedBy: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      stockUpdated: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      stockUpdatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'grns',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['grnNumber'] },
        { fields: ['purchaseOrderId'] },
        { fields: ['supplierId'] },
        { fields: ['status'] },
        { fields: ['receivedDate'] },
        { fields: ['createdAt'] },
      ],
    },
  );
};

module.exports = createGRNModel;
