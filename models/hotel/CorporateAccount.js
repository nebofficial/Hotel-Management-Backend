const { DataTypes } = require('sequelize');

const createCorporateAccountModel = (sequelize, schemaName) => {
  return sequelize.define(
    'CorporateAccount',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      accountNumber: {
        type: DataTypes.STRING(32),
        allowNull: false,
        unique: true,
      },
      companyName: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      contactPerson: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      billingAddress: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      gstNumber: {
        type: DataTypes.STRING(32),
        allowNull: true,
      },
      panNumber: {
        type: DataTypes.STRING(32),
        allowNull: true,
      },
      taxAddress: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      creditLimit: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      creditPeriodDays: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30,
      },
      currentOutstanding: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM('ACTIVE', 'ON_HOLD', 'CLOSED'),
        allowNull: false,
        defaultValue: 'ACTIVE',
      },
    },
    {
      tableName: 'corporate_accounts',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['accountNumber'], unique: true },
        { fields: ['companyName'] },
        { fields: ['status'] },
      ],
    },
  );
};

module.exports = createCorporateAccountModel;

