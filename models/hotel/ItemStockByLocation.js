const { DataTypes } = require('sequelize');

/**
 * ItemStockByLocation - quantity of each item at each location
 */
const createItemStockByLocationModel = (sequelize, schemaName) => {
  return sequelize.define(
    'ItemStockByLocation',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      itemId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      locationId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: 'item_stock_by_location',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['itemId'] },
        { fields: ['locationId'] },
        { unique: true, fields: ['itemId', 'locationId'] },
      ],
    },
  );
};

module.exports = createItemStockByLocationModel;
