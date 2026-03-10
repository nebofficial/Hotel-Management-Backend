const { DataTypes } = require('sequelize');

const createPaymentMethodModel = (sequelize, schemaName) => {
  return sequelize.define(
    "PaymentMethod",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      type: {
        // CASH, CARD, ONLINE, BANK
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      config: {
        // JSON string with gateway/bank settings etc.
        type: DataTypes.JSONB || DataTypes.JSON,
        allowNull: true,
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      confirmationMode: {
        // AUTO, MANUAL
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      lastUpdatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "payment_methods",
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ["type"] },
        { fields: ["active"] },
        { fields: ["sortOrder"] },
      ],
    }
  );
};

module.exports = createPaymentMethodModel;

