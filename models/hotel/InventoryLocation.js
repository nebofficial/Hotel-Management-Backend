const { DataTypes } = require('sequelize');

/**
 * InventoryLocation schema - stores/warehouses for multi-location stock
 */
const createInventoryLocationModel = (sequelize, schemaName) => {
  return sequelize.define(
    'InventoryLocation',
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
      code: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'inventory_locations',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['name'] },
        { fields: ['code'] },
        { fields: ['isActive'] },
      ],
    },
  );
};

module.exports = createInventoryLocationModel;
