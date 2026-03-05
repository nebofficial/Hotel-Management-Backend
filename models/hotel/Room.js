const { DataTypes } = require('sequelize');

/**
 * Room schema factory for hotel-specific data
 * This will be stored in each hotel's separate schema
 */
const createRoomModel = (sequelize, schemaName) => {
  return sequelize.define('Room', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    roomNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    roomType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    floor: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 2,
    },
    pricePerNight: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    amenities: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    status: {
      type: DataTypes.ENUM('available', 'occupied', 'maintenance', 'cleaning'),
      defaultValue: 'available',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
  }, {
    tableName: 'rooms',
    schema: schemaName,
    timestamps: true,
    indexes: [
      { fields: ['roomNumber'], unique: true },
      { fields: ['roomType'] },
      { fields: ['status'] },
    ],
  });
};

module.exports = createRoomModel;
