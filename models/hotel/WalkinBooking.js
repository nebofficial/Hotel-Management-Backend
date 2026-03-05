const { DataTypes } = require('sequelize');

/**
 * WalkinBooking schema for immediate check-ins without prior reservation.
 * Stored in each hotel's separate schema.
 */
const createWalkinBookingModel = (sequelize, schemaName) => {
  return sequelize.define(
    'WalkinBooking',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      walkinNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      guestId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      guestName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      guestPhone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      guestEmail: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      numberOfGuests: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      idProofType: {
        type: DataTypes.ENUM('aadhaar', 'passport', 'driving_license', 'voter_id', 'pan_card', 'other'),
        allowNull: true,
      },
      idProofNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      idProofImage: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      roomId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      roomNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      roomType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      checkInTime: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      expectedCheckOut: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      actualCheckOut: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      numberOfNights: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      occupancyType: {
        type: DataTypes.ENUM('single', 'double', 'triple', 'quad'),
        allowNull: false,
        defaultValue: 'single',
      },
      baseRoomRate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      occupancyCharge: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      weekendCharge: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      seasonalCharge: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      extraBedCharge: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      extraServices: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
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
      paidAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      balanceAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      paymentMode: {
        type: DataTypes.ENUM('cash', 'card', 'upi', 'bank_transfer', 'mixed'),
        allowNull: false,
        defaultValue: 'cash',
      },
      paymentDetails: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },
      billNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('checked_in', 'checked_out', 'cancelled'),
        allowNull: false,
        defaultValue: 'checked_in',
      },
      specialRequests: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      pricingBreakdown: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },
    },
    {
      tableName: 'walkin_bookings',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['walkinNumber'], unique: true },
        { fields: ['guestPhone'] },
        { fields: ['roomId'] },
        { fields: ['status'] },
        { fields: ['checkInTime'] },
        { fields: ['expectedCheckOut'] },
      ],
    }
  );
};

module.exports = createWalkinBookingModel;
