const { DataTypes } = require('sequelize');

/**
 * StockAdjustment - adjustment requests (damage, expiry, theft, physical audit, manual)
 */
const createStockAdjustmentModel = (sequelize, schemaName) => {
  return sequelize.define(
    'StockAdjustment',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      adjustmentNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      itemId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      adjustmentType: {
        type: DataTypes.ENUM('PHYSICAL_AUDIT', 'DAMAGE', 'EXPIRY', 'THEFT_LOSS', 'MANUAL_CORRECTION'),
        allowNull: false,
      },
      quantityDelta: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Positive = increase, Negative = decrease',
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
      reason: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
        allowNull: false,
        defaultValue: 'Pending',
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
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'stock_adjustments',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['adjustmentNumber'] },
        { fields: ['itemId'] },
        { fields: ['adjustmentType'] },
        { fields: ['status'] },
        { fields: ['requestedAt'] },
        { fields: ['createdAt'] },
      ],
    },
  );
};

module.exports = createStockAdjustmentModel;
