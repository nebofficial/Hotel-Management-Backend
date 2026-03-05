const { DataTypes } = require('sequelize');

/**
 * Booking schema factory for hotel-specific data
 * This will be stored in each hotel's separate schema
 */
const createBookingModel = (sequelize, schemaName) => {
  return sequelize.define('Booking', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    bookingNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    guestId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    guestName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    guestEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    guestPhone: {
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
    numberOfGuests: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'),
      defaultValue: 'pending',
    },
    isTentative: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    roomType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ratePlan: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pricingBreakdown: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    extras: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    roomCostTotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    extrasCostTotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    advancePaid: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
    balanceAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    paymentMode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cancelReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isNoShow: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    specialRequests: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'bookings',
    schema: schemaName,
    timestamps: true,
    indexes: [
      { fields: ['bookingNumber'], unique: true },
      { fields: ['guestId'] },
      { fields: ['status'] },
      { fields: ['isTentative'] },
      { fields: ['isNoShow'] },
      { fields: ['checkIn', 'checkOut'] },
    ],
  });
};

module.exports = createBookingModel;
