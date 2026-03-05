const { DataTypes } = require('sequelize');

/**
 * AdvancePayment schema factory for hotel-specific data.
 * This is a logical wrapper around advances collected for bookings/walk-ins.
 */
const createAdvancePaymentModel = (sequelize, schemaName) => {
  return sequelize.define(
    'AdvancePayment',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      receiptNumber: {
        type: DataTypes.STRING(32),
        allowNull: false,
        unique: true,
      },
      bookingId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      walkinId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      guestId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      guestName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      method: {
        type: DataTypes.STRING(32),
        allowNull: false,
      },
      notes: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      adjustedAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      refundedAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM('COLLECTED', 'PARTIALLY_USED', 'FULLY_ADJUSTED', 'REFUNDED'),
        allowNull: false,
        defaultValue: 'COLLECTED',
      },
    },
    {
      tableName: 'advance_payments',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['receiptNumber'], unique: true },
        { fields: ['bookingId'] },
        { fields: ['guestId'] },
        { fields: ['status'] },
      ],
    },
  );
};

module.exports = createAdvancePaymentModel;

