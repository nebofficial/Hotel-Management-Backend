const { DataTypes } = require('sequelize');

/**
 * PurchaseOrder schema factory for hotel-specific data
 * Tracks purchase orders from suppliers
 */
const createPurchaseOrderModel = (sequelize, schemaName) => {
  return sequelize.define(
    'PurchaseOrder',
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
      supplierId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      orderDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      expectedDeliveryDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('Draft', 'Pending', 'Approved', 'Ordered', 'Received', 'Cancelled'),
        allowNull: false,
        defaultValue: 'Draft',
      },
      items: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      taxRate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
      },
      taxAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      receivedItems: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      approvedBy: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'purchase_orders',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['orderNumber'] },
        { fields: ['supplierId'] },
        { fields: ['status'] },
        { fields: ['orderDate'] },
        { fields: ['createdAt'] },
      ],
    },
  );
};

module.exports = createPurchaseOrderModel;
