function generateCorporateStatement({ account, invoices = [] }) {
  const totalInvoiced = invoices.reduce((s, inv) => s + Number(inv.totalAmount || 0), 0);
  const totalPaid = invoices.reduce((s, inv) => s + Number(inv.paidAmount || 0), 0);
  const outstanding = totalInvoiced - totalPaid;

  return {
    account: account ? account.toJSON ? account.toJSON() : account : null,
    totals: {
      totalInvoiced,
      totalPaid,
      outstanding,
    },
    invoices: invoices.map((i) => (i.toJSON ? i.toJSON() : i)),
  };
}

module.exports = { generateCorporateStatement };

