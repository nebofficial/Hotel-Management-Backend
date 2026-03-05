const { DataTypes } = require('sequelize');

/**
 * StockHistory schema factory for hotel-specific data
 * Tracks stock in/out movements for inventory items
 */
const createStockHistoryModel = (sequelize, schemaName) => {
  return sequelize.define(
    'StockHistory',
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
      movementType: {
        type: DataTypes.ENUM('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER'),
        allowNull: false,
      },
      quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      previousStock: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      newStock: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      referenceType: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      referenceId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      performedBy: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: 'stock_history',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['itemId'] },
        { fields: ['movementType'] },
        { fields: ['createdAt'] },
        { fields: ['referenceType', 'referenceId'] },
      ],
    },
  );
};

module.exports = createStockHistoryModel;
