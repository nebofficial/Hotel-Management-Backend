const { DataTypes } = require('sequelize');

/**
 * LinenUsage schema factory for hotel-specific data
 * Tracks linen issued to rooms and staff
 */
const createLinenUsageModel = (sequelize, schemaName) => {
  return sequelize.define(
    'LinenUsage',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      linenItemId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      itemName: {
        // Denormalized for easier queries
        type: DataTypes.STRING,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      issuedTo: {
        // Room number or staff name
        type: DataTypes.STRING,
        allowNull: false,
      },
      issuedType: {
        // 'Room' or 'Staff'
        type: DataTypes.ENUM('Room', 'Staff'),
        allowNull: false,
        defaultValue: 'Room',
      },
      condition: {
        // 'New', 'Good', 'Worn', 'Damaged'
        type: DataTypes.ENUM('New', 'Good', 'Worn', 'Damaged'),
        allowNull: false,
        defaultValue: 'Good',
      },
      issuedDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      returnedDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      returnedCondition: {
        type: DataTypes.ENUM('New', 'Good', 'Worn', 'Damaged'),
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'linen_usage',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['linenItemId'] },
        { fields: ['issuedTo'] },
        { fields: ['issuedDate'] },
        { fields: ['condition'] },
      ],
    },
  );
};

module.exports = createLinenUsageModel;
