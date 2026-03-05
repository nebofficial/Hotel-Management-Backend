const { Op } = require('sequelize');

function pad4(n) {
  return String(n).padStart(4, '0');
}

async function getNextCorporateAccountNumber(CorporateAccount, year = new Date().getFullYear()) {
  const y = Number(year);
  const like = `CORP-${y}-%`;
  const rows = await CorporateAccount.findAll({
    attributes: ['accountNumber'],
    where: { accountNumber: { [Op.like]: like } },
    order: [['createdAt', 'DESC']],
    limit: 500,
  });
  let max = 0;
  for (const r of rows) {
    const cn = String(r.accountNumber || '');
    const m = cn.match(new RegExp(`^CORP-${y}-(\\d+)$`));
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `CORP-${y}-${pad4(max + 1)}`;
}

module.exports = { getNextCorporateAccountNumber };

