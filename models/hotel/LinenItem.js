const { DataTypes } = require('sequelize');

/**
 * LinenItem schema factory for hotel-specific data
 * Tracks linen stock levels, conditions, and thresholds
 */
const createLinenItemModel = (sequelize, schemaName) => {
  return sequelize.define(
    'LinenItem',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      itemName: {
        // e.g. 'Bed Sheets', 'Towels', 'Pillow Cases', 'Blankets', 'Uniforms'
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      category: {
        // 'Bedding', 'Bath', 'Uniform', 'Other'
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'Bedding',
      },
      currentStock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      minimumThreshold: {
        // Alert when stock falls below this
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 50,
      },
      maximumCapacity: {
        // Maximum storage capacity
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      unit: {
        // 'pieces', 'sets', 'pairs'
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'pieces',
      },
      location: {
        // Storage location/floor
        type: DataTypes.STRING,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'linen_items',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['itemName'], unique: true },
        { fields: ['category'] },
      ],
    },
  );
};

module.exports = createLinenItemModel;
