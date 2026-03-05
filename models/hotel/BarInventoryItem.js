const { DataTypes } = require('sequelize');

/**
 * BarInventoryItem schema factory for hotel-specific data
 * Tracks alcohol/non-alcohol stock for bar operations
 */
const createBarInventoryItemModel = (sequelize, schemaName) => {
  return sequelize.define(
    'BarInventoryItem',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      category: {
        // e.g., Beer, Wine, Whisky, Cocktail Mix
        type: DataTypes.STRING,
        allowNull: true,
      },
      unit: {
        // e.g., ml, bottle, can
        type: DataTypes.STRING,
        allowNull: true,
      },
      currentStock: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      reorderLevel: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      isAlcohol: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      bottleSizeMl: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'bar_inventory_items',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['name'] },
        { fields: ['category'] },
        { fields: ['isAlcohol'] },
        { fields: ['createdAt'] },
      ],
    },
  );
};

module.exports = createBarInventoryItemModel;

