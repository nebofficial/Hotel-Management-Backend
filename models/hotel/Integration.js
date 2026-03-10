const { DataTypes } = require('sequelize');

const createIntegrationModel = (sequelize, schemaName) => {
  return sequelize.define(
    'Integration',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      type: {
        type: DataTypes.ENUM(
          'PAYMENT_GATEWAY',
          'OTA',
          'EMAIL',
          'SMS',
          'ACCOUNTING',
          'API_KEY',
          'WEBHOOK'
        ),
        allowNull: false,
      },
      provider: {
        type: DataTypes.STRING(80),
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: true,
      },
      enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      status: {
        type: DataTypes.ENUM('connected', 'disconnected', 'error'),
        allowNull: false,
        defaultValue: 'disconnected',
      },
      config: {
        // Arbitrary provider-specific configuration
        type: DataTypes.JSONB || DataTypes.JSON,
        allowNull: true,
      },
      lastSyncedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      lastError: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'integrations',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['type'] },
        { fields: ['provider'] },
        { unique: true, fields: ['type', 'provider'] },
      ],
    }
  );
};

module.exports = createIntegrationModel;

