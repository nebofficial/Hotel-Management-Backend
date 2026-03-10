const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ActivityLog = sequelize.define(
  'ActivityLog',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    hotelId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
      // login, config, data, module, error
      type: DataTypes.STRING(24),
      allowNull: false,
    },
    module: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    action: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    details: {
      type: DataTypes.JSONB || DataTypes.JSON,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: 'activity_logs',
    timestamps: true,
    indexes: [
      { fields: ['hotelId'] },
      { fields: ['userId'] },
      { fields: ['type'] },
      { fields: ['module'] },
      { fields: ['createdAt'] },
    ],
  },
);

module.exports = ActivityLog;

