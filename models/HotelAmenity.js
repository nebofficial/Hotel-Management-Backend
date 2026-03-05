const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Hotel-level amenity definition (catalog of amenities for a hotel)
 */
const HotelAmenity = sequelize.define(
  'HotelAmenity',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    hotelId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    roomNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    floor: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    category: {
      // e.g. "room" or "hotel" (property-wide)
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'room',
    },
    available: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'hotel_amenities',
    indexes: [
      { fields: ['hotelId'] },
      { fields: ['hotelId', 'category'] },
      { fields: ['hotelId', 'name'] },
      { fields: ['hotelId', 'roomNumber'] },
    ],
  }
);

module.exports = HotelAmenity;

