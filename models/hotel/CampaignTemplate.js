const { DataTypes } = require('sequelize');

/**
 * CampaignTemplate schema factory for hotel-specific data
 */
const createCampaignTemplateModel = (sequelize, schemaName) => {
  return sequelize.define(
    'CampaignTemplate',
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
        type: DataTypes.ENUM('email', 'sms'),
        allowNull: false,
      },
      subject: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      isDefault: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      },
    },
    {
      tableName: 'campaign_templates',
      schema: schemaName,
      timestamps: true,
      indexes: [{ fields: ['type'] }],
    },
  );
};

module.exports = createCampaignTemplateModel;

