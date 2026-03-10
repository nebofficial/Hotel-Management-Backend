const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * RoomTypeDefinition – per-hotel room type (Single, Double, Suite, etc.) with description.
 * Used for consistent room classification; rooms reference by name.
 */
const RoomTypeDefinition = sequelize.define(
  'RoomTypeDefinition',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    hotelId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'hotels', key: 'id' },
      onDelete: 'CASCADE',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    defaultCapacity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 2,
    },
    defaultPricePerNight: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
  },
  {
    tableName: 'room_type_definitions',
    timestamps: true,
    indexes: [
      { fields: ['hotelId'] },
      { fields: ['hotelId', 'name'], unique: true },
    ],
  }
);

module.exports = RoomTypeDefinition;
