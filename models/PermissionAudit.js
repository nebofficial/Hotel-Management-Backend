const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PermissionAudit = sequelize.define(
  'PermissionAudit',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    hotelId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    roleId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    adminId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    adminName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    details: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    tableName: 'permission_audit_logs',
    timestamps: true,
    indexes: [
      { fields: ['hotelId'] },
      { fields: ['roleId'] },
      { fields: ['adminId'] },
      { fields: ['createdAt'] },
    ],
  },
);

module.exports = PermissionAudit;

