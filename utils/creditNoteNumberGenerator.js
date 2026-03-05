const { Op } = require('sequelize');

function pad4(n) {
  return String(n).padStart(4, '0');
}

async function getNextCreditNoteNumber(CreditNote, year = new Date().getFullYear()) {
  const y = Number(year);
  const like = `CN-${y}-%`;
  const rows = await CreditNote.findAll({
    attributes: ['creditNoteNumber'],
    where: { creditNoteNumber: { [Op.like]: like } },
    order: [['createdAt', 'DESC']],
    limit: 500,
  });
  let max = 0;
  for (const r of rows) {
    const cn = String(r.creditNoteNumber || '');
    const m = cn.match(new RegExp(`^CN-${y}-(\\d+)$`));
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `CN-${y}-${pad4(max + 1)}`;
}

module.exports = { getNextCreditNoteNumber };

