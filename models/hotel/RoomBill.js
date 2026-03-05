const { DataTypes } = require('sequelize');

/**
 * RoomBill schema factory for hotel-specific data
 * Stores room stay charges + extras + discounts + taxes + settlement details.
 */
const createRoomBillModel = (sequelize, schemaName) => {
  return sequelize.define(
    'RoomBill',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      billNumber: {
        type: DataTypes.STRING(32),
        allowNull: false,
        unique: true,
      },
      bookingId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      guestId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      guestName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      roomId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      roomNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      checkIn: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      checkOut: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      nights: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },

      // Inputs
      pricePerNight: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      lateCheckoutCharge: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      extraBedCharge: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      extras: {
        // [{ name, category, qty, rate, amount }]
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      discountAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      discountPercent: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: false,
        defaultValue: 0,
      },
      applyDiscountBeforeTax: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      gstPercent: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: false,
        defaultValue: 0,
      },
      serviceChargeEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      serviceChargePercent: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: false,
        defaultValue: 0,
      },
      placeOfSupplyState: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      hotelState: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      // Computed totals
      roomSubtotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      extrasSubtotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      subtotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      discountTotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      taxableAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      cgst: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      sgst: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      igst: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      taxTotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      serviceChargeAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      grandTotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },

      // Settlement
      advancePaid: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      advanceAdjusted: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      netPayable: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      paymentSplit: {
        // [{ method: 'cash'|'card'|'upi'|'bank', amount }]
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      status: {
        type: DataTypes.ENUM('DRAFT', 'PENDING', 'SETTLED', 'REFUNDED', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'DRAFT',
      },
      refundAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      refundReason: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'INR',
      },
    },
    {
      tableName: 'room_bills',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['billNumber'], unique: true },
        { fields: ['bookingId'] },
        { fields: ['guestId'] },
        { fields: ['roomNumber'] },
        { fields: ['status'] },
        { fields: ['createdAt'] },
      ],
    },
  );
};

module.exports = createRoomBillModel;

