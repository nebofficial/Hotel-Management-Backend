const { DataTypes } = require('sequelize');

/**
 * MenuCategory schema factory for hotel-specific data
 * Manages food categories (Starters, Main Course, Desserts, etc.)
 */
const createMenuCategoryModel = (sequelize, schemaName) => {
  return sequelize.define(
    'MenuCategory',
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
      displayOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      colorTag: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'menu_categories',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['name'] },
        { fields: ['isActive'] },
        { fields: ['displayOrder'] },
      ],
    },
  );
};

module.exports = createMenuCategoryModel;
