const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * HotelProfile
 * Stores per-hotel branding and formatting preferences that are not part of the core Hotel record.
 */
const HotelProfile = sequelize.define(
  'HotelProfile',
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
    logoUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    currencySymbol: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    language: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    timezone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    dateFormat: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    timeFormat: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    planDisplayName: {
      // Optional, to show a friendly plan name if different from core Plan.name
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: 'hotel_profiles',
    timestamps: true,
    indexes: [{ fields: ['hotelId'] }],
  }
);

module.exports = HotelProfile;

