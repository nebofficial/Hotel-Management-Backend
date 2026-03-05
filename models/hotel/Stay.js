const { DataTypes } = require('sequelize');

/**
 * Stay model – represents an in-house stay created during check-in.
 * Linked to Booking but can hold extra runtime info like deposit, signature, key card, etc.
 */
const createStayModel = (sequelize, schemaName) => {
  return sequelize.define(
    'Stay',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
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
      roomType: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      checkIn: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      expectedCheckOut: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      actualCheckOut: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('in_progress', 'checked_in', 'checked_out'),
        allowNull: false,
        defaultValue: 'in_progress',
      },
      requiredDeposit: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      paidDeposit: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      depositCurrency: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'USD',
      },
      depositLedgerId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      signatureImage: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Base64-encoded PNG/JPEG of digital signature',
      },
      keyCardNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      keyCardActivatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      keyCardValidUntil: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      welcomeSlipPrintedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'stays',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['bookingId'] },
        { fields: ['guestId'] },
        { fields: ['roomId'] },
        { fields: ['status'] },
      ],
    }
  );
};

module.exports = createStayModel;

