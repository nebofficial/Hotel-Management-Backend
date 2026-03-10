const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * CheckinCheckoutRules
 * Per-hotel check-in / check-out policies and charges.
 */
const CheckinCheckoutRules = sequelize.define(
  'CheckinCheckoutRules',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    hotelId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    standardCheckInTime: { type: DataTypes.STRING, allowNull: true },   // e.g. "14:00"
    standardCheckOutTime: { type: DataTypes.STRING, allowNull: true },  // e.g. "11:00"
    allowEarlyCheckin: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    earliestCheckinTime: { type: DataTypes.STRING, allowNull: true },
    earlyCheckinFeeType: { type: DataTypes.STRING, allowNull: true },   // fixed, percentage, hourly
    earlyCheckinFee: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    allowLateCheckout: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    latestCheckoutTime: { type: DataTypes.STRING, allowNull: true },
    lateCheckoutFeeType: { type: DataTypes.STRING, allowNull: true },
    lateCheckoutFee: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    hourlyExtensionRate: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    gracePeriodMinutes: { type: DataTypes.INTEGER, allowNull: true },
    chargeAfterGracePeriod: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true },
    autoCheckoutAfterMinutes: { type: DataTypes.INTEGER, allowNull: true }, // 0 = disabled
    sendCheckoutReminder: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    policyNotes: { type: DataTypes.TEXT, allowNull: true },
    specialInstructions: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'checkin_checkout_rules',
    timestamps: true,
    indexes: [{ fields: ['hotelId'] }],
  }
);

module.exports = CheckinCheckoutRules;
