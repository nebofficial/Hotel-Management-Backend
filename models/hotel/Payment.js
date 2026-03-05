const { DataTypes } = require('sequelize');

/**
 * Payment schema factory for hotel-specific data
 * This will be stored in each hotel's separate schema
 */
const createPaymentModel = (sequelize, schemaName) => {
  return sequelize.define('Payment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    bookingId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD',
    },
    paymentMethod: {
      type: DataTypes.ENUM('credit_card', 'debit_card', 'cash', 'bank_transfer', 'other'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
      defaultValue: 'pending',
    },
    transactionId: {
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
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'payments',
    schema: schemaName,
    timestamps: true,
    indexes: [
      { fields: ['bookingId'] },
      { fields: ['status'] },
      { fields: ['createdAt'] },
      { fields: ['transactionId'], unique: true },
    ],
  });
};

module.exports = createPaymentModel;
