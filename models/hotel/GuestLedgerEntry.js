const { DataTypes } = require('sequelize');

/**
 * Guest ledger entry - debits (charges) and credits (payments, advance, adjustments)
 * Stored per hotel schema.
 */
const createGuestLedgerEntryModel = (sequelize, schemaName) => {
  return sequelize.define(
    'GuestLedgerEntry',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      guestId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      bookingId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM('ROOM_CHARGE', 'RESTAURANT', 'PAYMENT', 'ADVANCE', 'ADJUSTMENT', 'REFUND', 'EXTRA_BED', 'LATE_CHECKOUT'),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      isDebit: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      referenceId: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Payment id, RestaurantBill id, etc.',
      },
      currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'USD',
      },
    },
    {
      tableName: 'guest_ledger_entries',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['guestId'] },
        { fields: ['bookingId'] },
        { fields: ['createdAt'] },
        { fields: ['type'] },
      ],
    }
  );
};

module.exports = createGuestLedgerEntryModel;
