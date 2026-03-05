const { DataTypes } = require('sequelize');

/**
 * StockAlertNotification - logs for low stock alert notifications
 */
const createStockAlertNotificationModel = (sequelize, schemaName) => {
  return sequelize.define(
    'StockAlertNotification',
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
      alertType: {
        type: DataTypes.ENUM('LOW_STOCK', 'CRITICAL_STOCK', 'OUT_OF_STOCK'),
        allowNull: false,
      },
      channel: {
        type: DataTypes.ENUM('EMAIL', 'SYSTEM', 'BOTH'),
        allowNull: false,
        defaultValue: 'SYSTEM',
      },
      recipient: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Email address if channel is EMAIL or BOTH',
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('Sent', 'Failed', 'Pending'),
        allowNull: false,
        defaultValue: 'Pending',
      },
      currentStock: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      reorderLevel: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      sentAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'stock_alert_notifications',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['itemId'] },
        { fields: ['alertType'] },
        { fields: ['status'] },
        { fields: ['createdAt'] },
      ],
    },
  );
};

module.exports = createStockAlertNotificationModel;
