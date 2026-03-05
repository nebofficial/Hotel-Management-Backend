const { DataTypes } = require('sequelize');

/**
 * InventoryCategory schema factory for hotel-specific data
 * Supports nested categories, images, sorting, and active/inactive toggle
 */
const createInventoryCategoryModel = (sequelize, schemaName) => {
  return sequelize.define(
    'InventoryCategory',
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
      imageUrl: {
        // Can store a URL or a base64 data URL
        type: DataTypes.TEXT,
        allowNull: true,
      },
      parentId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'inventory_categories',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['name'] },
        { fields: ['parentId'] },
        { fields: ['sortOrder'] },
        { fields: ['isActive'] },
        { fields: ['createdAt'] },
      ],
    },
  );
};

module.exports = createInventoryCategoryModel;

