const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const createExpenseModel = require('../models/hotel/Expense');
const createAccountHeadModel = require('../models/hotel/AccountHead');
const createGuestLedgerEntryModel = require('../models/hotel/GuestLedgerEntry');
const createCashBankAccountModel = require('../models/hotel/CashBankAccount');
const createCashBankEntryModel = require('../models/hotel/CashBankEntry');
const createInvoiceModel = require('../models/hotel/Invoice');
const createTaxSettingModel = require('../models/hotel/TaxSetting');
const createJournalEntryModel = require('../models/hotel/JournalEntry');

async function syncFinanceTables() {
  try {
    const schemas = await sequelize.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'hotel_%'`,
      { type: QueryTypes.SELECT },
    );
    for (const row of schemas) {
      const schemaName = row.schema_name;
      try {
        const Expense = createExpenseModel(sequelize, schemaName);
        await Expense.sync({ alter: false });
        const AccountHead = createAccountHeadModel(sequelize, schemaName);
        await AccountHead.sync({ alter: false });
        const GuestLedgerEntry = createGuestLedgerEntryModel(sequelize, schemaName);
        await GuestLedgerEntry.sync({ alter: false });
        const CashBankAccount = createCashBankAccountModel(sequelize, schemaName);
        const CashBankEntry = createCashBankEntryModel(sequelize, schemaName);
        const Invoice = createInvoiceModel(sequelize, schemaName);
        const TaxSetting = createTaxSettingModel(sequelize, schemaName);
        const JournalEntry = createJournalEntryModel(sequelize, schemaName);
        // NOTE: alter:true can fail on some Postgres setups with enum/constraint duplicates.
        // Keep startup safe.
        await CashBankAccount.sync({ alter: false });
        await CashBankEntry.sync({ alter: false });
        await Invoice.sync({ alter: false });
        await TaxSetting.sync({ alter: false });
        await JournalEntry.sync({ alter: false });
        console.log(`✓ Synced Finance tables (Expense, AccountHead, GuestLedgerEntry, CashBankAccount, CashBankEntry, Invoice, TaxSetting, JournalEntry) for ${schemaName}`);
      } catch (error) {
        console.error(`✗ Failed to sync Finance for ${schemaName}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error syncing Finance tables:', error);
  }
}

module.exports = syncFinanceTables;
