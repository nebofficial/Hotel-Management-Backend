const { DataTypes } = require("sequelize");

const createCashBankAccountModel = (sequelize, schemaName) => {
  return sequelize.define(
    "CashBankAccount",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM("CASH", "BANK"),
        allowNull: false,
      },
      accountNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      ifsc: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      openingBalance: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      currentBalance: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: "USD",
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: "cash_bank_accounts",
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ["type"] },
        { fields: ["isActive"] },
      ],
    }
  );
};

module.exports = createCashBankAccountModel;
