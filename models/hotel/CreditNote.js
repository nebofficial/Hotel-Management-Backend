const { DataTypes } = require('sequelize');

/**
 * CreditNote schema factory for hotel-specific data.
 */
const createCreditNoteModel = (sequelize, schemaName) => {
  return sequelize.define(
    'CreditNote',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      creditNoteNumber: {
        type: DataTypes.STRING(32),
        allowNull: false,
        unique: true,
      },
      invoiceId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      bookingId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      guestId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      guestName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      totalAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      usedAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      reason: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      expiryDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('ACTIVE', 'PARTIALLY_USED', 'EXPIRED', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'ACTIVE',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'credit_notes',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['creditNoteNumber'], unique: true },
        { fields: ['guestId'] },
        { fields: ['bookingId'] },
        { fields: ['expiryDate'] },
        { fields: ['status'] },
      ],
    },
  );
};

module.exports = createCreditNoteModel;

