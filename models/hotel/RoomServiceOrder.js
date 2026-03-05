const { DataTypes } = require('sequelize');

/**
 * RoomServiceOrder schema factory for hotel-specific data
 * Stores in-room dining / room-service orders
 */
const createRoomServiceOrderModel = (sequelize, schemaName) => {
  return sequelize.define(
    'RoomServiceOrder',
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
      roomNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      guestName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bookingId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bookingNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('Pending', 'Preparing', 'OutForDelivery', 'Delivered', 'Cancelled'),
        allowNull: false,
        defaultValue: 'Pending',
      },
      priority: {
        type: DataTypes.ENUM('Normal', 'VIP', 'Urgent'),
        allowNull: false,
        defaultValue: 'Normal',
      },
      items: {
        // JSON array: [{ id, name, quantity, price, notes }]
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      specialInstructions: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      estimatedDeliveryMinutes: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      serviceChargePercent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
      },
      serviceChargeAmount: {
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
      chargeToRoom: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      linkedToFrontDesk: {
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
      tableName: 'room_service_orders',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['orderNumber'] },
        { fields: ['roomNumber'] },
        { fields: ['status'] },
        { fields: ['priority'] },
        { fields: ['createdAt'] },
      ],
    },
  );
};

module.exports = createRoomServiceOrderModel;

