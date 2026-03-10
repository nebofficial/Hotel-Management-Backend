const { DataTypes } = require('sequelize');

/**
 * Campaign schema factory for hotel-specific data
 * Stored in each hotel's separate schema
 */
const createCampaignModel = (sequelize, schemaName) => {
  return sequelize.define(
    'Campaign',
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
      type: {
        // email or sms
        type: DataTypes.ENUM('email', 'sms'),
        allowNull: false,
      },
      templateId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      subject: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      segment: {
        // e.g. "VIP Guests", "All guests", "Deluxe only"
        type: DataTypes.STRING,
        allowNull: true,
      },
      filters: {
        // JSON filter definition for segmentation
        type: DataTypes.JSONB,
        allowNull: true,
      },
      status: {
        // draft, scheduled, active, completed, stopped
        type: DataTypes.ENUM('draft', 'scheduled', 'active', 'completed', 'stopped'),
        allowNull: false,
        defaultValue: 'draft',
      },
      scheduledAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      sentAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      totalRecipients: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      sentCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      opens: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      clicks: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      deliveries: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      failures: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      updatedBy: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'campaigns',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['type'] },
        { fields: ['status'] },
        { fields: ['scheduledAt'] },
      ],
    },
  );
};

module.exports = createCampaignModel;

