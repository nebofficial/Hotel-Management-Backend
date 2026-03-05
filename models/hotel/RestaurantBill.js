const { DataTypes } = require('sequelize');

/**
 * RestaurantBill schema factory for hotel-specific data
 * Stores POS billing transactions for restaurant orders
 */
const createRestaurantBillModel = (sequelize, schemaName) => {
  return sequelize.define(
    'RestaurantBill',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      billNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      orderType: {
        type: DataTypes.ENUM('Dine-in', 'Takeaway', 'Delivery'),
        allowNull: false,
        defaultValue: 'Dine-in',
      },
      tableNo: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      customerPhone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      guestName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      items: {
        // JSON array of cart items: [{ id, name, price, quantity, taxRate, notes }]
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      discountAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      taxAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      serviceCharge: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      roundOff: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM('Pending', 'Paid', 'Cancelled', 'Refunded', 'On Hold'),
        allowNull: false,
        defaultValue: 'Pending',
      },
      payment: {
        // JSON: { method, cashAmount, cardAmount, upiAmount }
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      taxBreakdown: {
        // JSON: { taxableAmount, cgst, sgst, serviceCharge, totalTax, roundOff, grossTotal }
        type: DataTypes.JSONB,
        allowNull: true,
      },
      splitInfo: {
        // JSON: optional split bill details
        type: DataTypes.JSONB,
        allowNull: true,
      },
      refundReason: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      refundedAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      refundedBy: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'restaurant_bills',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['tableNo'] },
        { fields: ['status'] },
        { fields: ['createdAt'] },
      ],
    },
  );
};

module.exports = createRestaurantBillModel;
