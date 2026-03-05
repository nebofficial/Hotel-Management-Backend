const { getNextCorporateAccountNumber } = require('../utils/corporateAccountNumberGenerator');
const { validateCreditLimit } = require('../utils/creditLimitValidator');
const { generateMonthlyInvoices } = require('../utils/invoiceBatchGenerator');
const { generateCorporateStatement } = require('../utils/statementGenerator');

function toJson(m) {
  return m && m.toJSON ? m.toJSON() : m;
}

exports.createCorporateAccount = async (req, res) => {
  try {
    const { CorporateAccount } = req.hotelModels;
    await CorporateAccount.sync({ alter: false });
    const {
      companyName,
      contactPerson,
      phone,
      email,
      billingAddress,
      gstNumber,
      panNumber,
      taxAddress,
      creditLimit,
      creditPeriodDays,
    } = req.body || {};

    if (!companyName) return res.status(400).json({ message: 'Company name is required' });

    const accountNumber = await getNextCorporateAccountNumber(CorporateAccount);

    const acc = await CorporateAccount.create({
      accountNumber,
      companyName,
      contactPerson,
      phone,
      email,
      billingAddress,
      gstNumber,
      panNumber,
      taxAddress,
      creditLimit: Number(creditLimit || 0),
      creditPeriodDays: Number(creditPeriodDays || 30),
    });

    res.status(201).json({ account: toJson(acc) });
  } catch (error) {
    console.error('createCorporateAccount error:', error);
    res.status(500).json({ message: 'Failed to create corporate account', error: error.message });
  }
};

exports.fetchCorporateAccounts = async (req, res) => {
  try {
    const { CorporateAccount, CorporateInvoice } = req.hotelModels;
    await CorporateAccount.sync({ alter: false });
    await CorporateInvoice.sync({ alter: false });

    const accounts = await CorporateAccount.findAll();
    const result = [];
    for (const acc of accounts) {
      const invoices = await CorporateInvoice.findAll({
        where: { corporateAccountId: acc.id },
      });
      const totalInvoiced = invoices.reduce((s, i) => s + Number(i.totalAmount || 0), 0);
      const totalPaid = invoices.reduce((s, i) => s + Number(i.paidAmount || 0), 0);
      const outstanding = totalInvoiced - totalPaid;
      result.push({
        ...toJson(acc),
        totalInvoiced,
        totalPaid,
        outstanding,
      });
    }
    res.json({ accounts: result });
  } catch (error) {
    console.error('fetchCorporateAccounts error:', error);
    res.status(500).json({ message: 'Failed to fetch corporate accounts', error: error.message });
  }
};

exports.generateCorporateInvoice = async (req, res) => {
  try {
    const { corporateAccountId, amount, periodStart, periodEnd } = req.body || {};
    if (!corporateAccountId) {
      return res.status(400).json({ message: 'corporateAccountId is required' });
    }
    const { CorporateAccount, CorporateInvoice } = req.hotelModels;
    await CorporateAccount.sync({ alter: false });
    await CorporateInvoice.sync({ alter: false });

    const acc = await CorporateAccount.findByPk(corporateAccountId);
    if (!acc) return res.status(404).json({ message: 'Corporate account not found' });

    const amt = Number(amount || 0) || 0;
    if (amt <= 0) return res.status(400).json({ message: 'Invoice amount must be > 0' });

    const limitCheck = validateCreditLimit({
      creditLimit: acc.creditLimit,
      currentOutstanding: acc.currentOutstanding,
      newCharge: amt,
    });
    if (!limitCheck.ok) {
      return res.status(400).json({ message: limitCheck.message });
    }

    const invoiceNumber = `CORP-INV-${new Date().getFullYear()}-${Date.now().toString(36).slice(-4)}`;

    const inv = await CorporateInvoice.create({
      invoiceNumber,
      corporateAccountId: acc.id,
      periodStart: periodStart || null,
      periodEnd: periodEnd || null,
      totalAmount: amt,
      paidAmount: 0,
      status: 'PENDING',
      details: {},
    });

    await acc.update({
      currentOutstanding: Number(acc.currentOutstanding || 0) + amt,
    });

    res.status(201).json({ invoice: toJson(inv), account: toJson(acc) });
  } catch (error) {
    console.error('generateCorporateInvoice error:', error);
    res.status(500).json({ message: 'Failed to generate corporate invoice', error: error.message });
  }
};

exports.generateBulkInvoices = async (req, res) => {
  try {
    const { month, year } = req.body || {};
    const { CorporateAccount, CorporateInvoice } = req.hotelModels;
    await CorporateAccount.sync({ alter: false });
    await CorporateInvoice.sync({ alter: false });
    const created = await generateMonthlyInvoices({
      CorporateAccount,
      CorporateInvoice,
      month: month || new Date().getMonth() + 1,
      year: year || new Date().getFullYear(),
    });
    res.json({ invoices: created });
  } catch (error) {
    console.error('generateBulkInvoices error:', error);
    res.status(500).json({ message: 'Failed to generate bulk invoices', error: error.message });
  }
};

exports.fetchOutstandingPayments = async (req, res) => {
  try {
    const { CorporateAccount, CorporateInvoice } = req.hotelModels;
    await CorporateAccount.sync({ alter: false });
    await CorporateInvoice.sync({ alter: false });
    const accounts = await CorporateAccount.findAll();
    const out = [];
    for (const acc of accounts) {
      const invoices = await CorporateInvoice.findAll({
        where: { corporateAccountId: acc.id, status: ['PENDING', 'PARTIAL'] },
      });
      const total = invoices.reduce((s, i) => s + Number(i.totalAmount || 0), 0);
      const paid = invoices.reduce((s, i) => s + Number(i.paidAmount || 0), 0);
      out.push({
        accountNumber: acc.accountNumber,
        companyName: acc.companyName,
        totalAmount: total,
        paidAmount: paid,
        outstanding: total - paid,
      });
    }
    res.json({ companies: out });
  } catch (error) {
    console.error('fetchOutstandingPayments error:', error);
    res.status(500).json({ message: 'Failed to fetch outstanding payments', error: error.message });
  }
};

exports.downloadStatement = async (req, res) => {
  try {
    const { accountId } = req.query || {};
    const { CorporateAccount, CorporateInvoice } = req.hotelModels;
    await CorporateAccount.sync({ alter: false });
    await CorporateInvoice.sync({ alter: false });
    const acc = await CorporateAccount.findByPk(accountId);
    if (!acc) return res.status(404).json({ message: 'Corporate account not found' });
    const invoices = await CorporateInvoice.findAll({
      where: { corporateAccountId: acc.id },
      order: [['createdAt', 'DESC']],
    });
    const statement = generateCorporateStatement({ account: acc, invoices });
    res.json({ statement });
  } catch (error) {
    console.error('downloadStatement error:', error);
    res.status(500).json({ message: 'Failed to generate statement', error: error.message });
  }
};

