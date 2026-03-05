async function generateMonthlyInvoices({ CorporateAccount, CorporateInvoice, month, year }) {
  // Placeholder: in a real system, aggregate all bills for each corporate account.
  const accounts = await CorporateAccount.findAll({ where: { status: 'ACTIVE' } });
  const created = [];
  for (const acc of accounts) {
    const invoiceNumber = `CORP-INV-${year}-${String(month).padStart(2, '0')}-${acc.accountNumber.slice(-3)}`;
    const inv = await CorporateInvoice.create({
      invoiceNumber,
      corporateAccountId: acc.id,
      periodStart: `${year}-${String(month).padStart(2, '0')}-01`,
      periodEnd: `${year}-${String(month).padStart(2, '0')}-28`,
      totalAmount: 0,
      paidAmount: 0,
      status: 'PENDING',
      details: {},
    });
    created.push(inv.toJSON());
  }
  return created;
}

module.exports = { generateMonthlyInvoices };

