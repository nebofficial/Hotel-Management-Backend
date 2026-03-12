const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SupportTicket = sequelize.define(
  'SupportTicket',
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
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    category: {
      // "Bug", "Feature Request", "Technical Issue", "Other"
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: 'Technical Issue',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
      allowNull: false,
      defaultValue: 'Medium',
    },
    status: {
      type: DataTypes.ENUM(
        'Open',
        'In Review',
        'In Progress',
        'Waiting for User',
        'Resolved',
        'Closed',
      ),
      allowNull: false,
      defaultValue: 'Open',
    },
    attachments: {
      type: DataTypes.JSONB || DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    comments: {
      type: DataTypes.JSONB || DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    history: {
      type: DataTypes.JSONB || DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
  },
  {
    tableName: 'support_tickets',
    timestamps: true,
    indexes: [
      { fields: ['hotelId'] },
      { fields: ['userId'] },
      { fields: ['priority'] },
      { fields: ['status'] },
      { fields: ['createdAt'] },
    ],
  },
);

module.exports = SupportTicket;

