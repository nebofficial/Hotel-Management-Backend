const { DataTypes } = require('sequelize');

const createJournalEntryModel = (sequelize, schemaName) => {
  return sequelize.define(
    'JournalEntry',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      voucherNumber: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      narration: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      lines: {
        // [{ accountId, accountName, debit, credit }]
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      totalDebit: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      totalCredit: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      isBalanced: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      autoPosted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      reversedFromId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: 'journal_entries',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['date'] },
        { fields: ['voucherNumber'], unique: true },
      ],
    }
  );
};

module.exports = createJournalEntryModel;

