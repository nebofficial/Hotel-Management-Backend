const { DataTypes } = require('sequelize');

/**
 * StockTransfer - transfer requests between locations
 */
const createStockTransferModel = (sequelize, schemaName) => {
  return sequelize.define(
    'StockTransfer',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      transferNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      fromLocationId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      toLocationId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('Pending', 'Approved', 'InTransit', 'Completed', 'Rejected'),
        allowNull: false,
        defaultValue: 'Pending',
      },
      items: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
        // [{ itemId, itemName, quantity, unit }]
      },
      totalItems: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      requestedBy: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      requestedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      approvedBy: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'stock_transfers',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['transferNumber'] },
        { fields: ['fromLocationId'] },
        { fields: ['toLocationId'] },
        { fields: ['status'] },
        { fields: ['requestedAt'] },
        { fields: ['createdAt'] },
      ],
    },
  );
};

module.exports = createStockTransferModel;
