const { Op } = require('sequelize');

function pad4(n) {
  return String(n).padStart(4, '0');
}

/**
 * Generate next advance receipt like ADV-2026-0001 based on AdvancePayment.receiptNumber.
 */
async function getNextAdvanceReceiptNumber(AdvancePayment, year = new Date().getFullYear()) {
  const y = Number(year);
  const like = `ADV-${y}-%`;

  const rows = await AdvancePayment.findAll({
    attributes: ['receiptNumber'],
    where: { receiptNumber: { [Op.like]: like } },
    order: [['createdAt', 'DESC']],
    limit: 500,
  });

  let max = 0;
  for (const r of rows) {
    const rn = String(r.receiptNumber || '');
    const m = rn.match(new RegExp(`^ADV-${y}-(\\d+)$`));
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `ADV-${y}-${pad4(max + 1)}`;
}

module.exports = { getNextAdvanceReceiptNumber };

