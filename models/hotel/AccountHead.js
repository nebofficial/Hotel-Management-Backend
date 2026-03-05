const { DataTypes } = require('sequelize');

/**
 * Chart of Accounts - Account Head
 * Stored per hotel schema. Supports hierarchy via parentId.
 */
const createAccountHeadModel = (sequelize, schemaName) => {
  return sequelize.define(
    'AccountHead',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      code: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      accountType: {
        type: DataTypes.ENUM('Asset', 'Liability', 'Income', 'Expense', 'Equity'),
        allowNull: false,
      },
      parentId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      openingBalance: {
        type: DataTypes.DECIMAL(18, 2),
        defaultValue: 0,
      },
      balanceType: {
        type: DataTypes.ENUM('Debit', 'Credit'),
        defaultValue: 'Debit',
      },
      status: {
        type: DataTypes.ENUM('Active', 'Inactive'),
        defaultValue: 'Active',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'USD',
      },
    },
    {
      tableName: 'account_heads',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['code'], unique: true },
        { fields: ['accountType'] },
        { fields: ['parentId'] },
        { fields: ['status'] },
      ],
    }
  );
};

module.exports = createAccountHeadModel;
