const { DataTypes } = require('sequelize');

/**
 * TakeawayDeliveryOrder schema for hotel-specific data
 * Orders with tracking ID, status, payment, delivery partner, etc.
 */
const createTakeawayDeliveryOrderModel = (sequelize, schemaName) => {
  return sequelize.define(
    'TakeawayDeliveryOrder',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      trackingId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      orderType: {
        type: DataTypes.ENUM('Takeaway', 'Delivery'),
        allowNull: false,
        defaultValue: 'Delivery',
      },
      customerId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      customerName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      customerPhone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      deliveryPartnerId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('Placed', 'Packed', 'OutForDelivery', 'Delivered', 'Cancelled'),
        allowNull: false,
        defaultValue: 'Placed',
      },
      paymentStatus: {
        type: DataTypes.ENUM('Paid', 'Pending', 'Failed'),
        allowNull: false,
        defaultValue: 'Pending',
      },
      paymentMode: {
        type: DataTypes.ENUM('COD', 'Online'),
        allowNull: false,
        defaultValue: 'COD',
      },
      items: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      deliveryAddress: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      pincode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      deliveryCharges: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      source: {
        type: DataTypes.ENUM('manual', 'online'),
        allowNull: false,
        defaultValue: 'manual',
      },
      specialInstructions: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'takeaway_delivery_orders',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['trackingId'] },
        { fields: ['status'] },
        { fields: ['paymentStatus'] },
        { fields: ['customerId'] },
        { fields: ['deliveryPartnerId'] },
        { fields: ['createdAt'] },
      ],
    },
  );
};

module.exports = createTakeawayDeliveryOrderModel;
