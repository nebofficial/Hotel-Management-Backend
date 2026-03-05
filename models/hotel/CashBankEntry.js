const { DataTypes } = require("sequelize");

const createCashBankEntryModel = (sequelize, schemaName) => {
  return sequelize.define(
    "CashBankEntry",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      accountId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM(
          "DEPOSIT",
          "WITHDRAWAL",
          "TRANSFER_IN",
          "TRANSFER_OUT",
          "CHARGE",
          "ADJUSTMENT"
        ),
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      referenceNo: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      isDebit: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      reconciled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      statementDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: "USD",
      },
    },
    {
      tableName: "cash_bank_entries",
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ["accountId"] },
        { fields: ["date"] },
        { fields: ["reconciled"] },
      ],
    }
  );
};

module.exports = createCashBankEntryModel;
