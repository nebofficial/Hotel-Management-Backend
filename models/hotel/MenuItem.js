const { DataTypes } = require('sequelize');

/**
 * MenuItem schema factory for hotel-specific data
 * Manages individual food items with pricing, availability, tax, etc.
 */
const createMenuItemModel = (sequelize, schemaName) => {
  return sequelize.define(
    'MenuItem',
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
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      categoryId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      taxRate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
      },
      isAvailable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      isVeg: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      imageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      addOns: {
        // JSON array: [{ name, price }, ...]
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
      },
      timeBasedPricing: {
        // JSON: { breakfast: { start: "08:00", end: "11:00", price }, ... }
        type: DataTypes.JSONB,
        allowNull: true,
      },
      stockLinked: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      stockItemId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      recipeMapping: {
        // JSON: { ingredients: [...], instructions: [...] }
        type: DataTypes.JSONB,
        allowNull: true,
      },
      comboLinked: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      comboItems: {
        // JSON array of item IDs in combo
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
      },
      displayOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: 'menu_items',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['categoryId'] },
        { fields: ['isAvailable'] },
        { fields: ['isVeg'] },
        { fields: ['name'] },
        { fields: ['displayOrder'] },
      ],
    },
  );
};

module.exports = createMenuItemModel;
