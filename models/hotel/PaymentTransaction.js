const { DataTypes } = require('sequelize');

const createPaymentTransactionModel = (sequelize, schemaName) => {
  return sequelize.define(
    "PaymentTransaction",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      methodId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      methodName: {
        type: DataTypes.STRING(120),
        allowNull: true,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: "USD",
      },
      direction: {
        // IN = payment received, OUT = refund/payout
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: "IN",
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "PENDING",
      },
      reference: {
        type: DataTypes.STRING(190),
        allowNull: true,
      },
      meta: {
        type: DataTypes.JSONB || DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      tableName: "payment_transactions",
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ["methodId"] },
        { fields: ["status"] },
        { fields: ["direction"] },
        { fields: ["createdAt"] },
      ],
    }
  );
};

module.exports = createPaymentTransactionModel;

