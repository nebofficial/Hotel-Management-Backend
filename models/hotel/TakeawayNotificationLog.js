const { DataTypes } = require('sequelize');

/**
 * TakeawayNotificationLog schema for hotel-specific data
 * Log SMS / WhatsApp notifications for order updates
 */
const createTakeawayNotificationLogModel = (sequelize, schemaName) => {
  return sequelize.define(
    'TakeawayNotificationLog',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      orderId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      trackingId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      channel: {
        type: DataTypes.ENUM('SMS', 'WhatsApp'),
        allowNull: false,
      },
      recipient: {
        type: DataTypes.STRING,
        allowNull: true,
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
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'takeaway_notification_log',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['orderId'] },
        { fields: ['trackingId'] },
        { fields: ['channel'] },
        { fields: ['createdAt'] },
      ],
    },
  );
};

module.exports = createTakeawayNotificationLogModel;
