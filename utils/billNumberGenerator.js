const { Op } = require('sequelize');

function pad4(n) {
  return String(n).padStart(4, '0');
}

/**
 * Generates next restaurant bill number like BILL-2026-0001 (year-based sequence).
 */
async function getNextRestaurantBillNumber(RestaurantBill, year = new Date().getFullYear()) {
  const y = Number(year);
  const like = `BILL-${y}-%`;
  const rows = await RestaurantBill.findAll({
    attributes: ['billNumber'],
    where: { billNumber: { [Op.like]: like } },
    order: [['createdAt', 'DESC']],
    limit: 500,
  });
  let max = 0;
  for (const r of rows) {
    const bn = String(r.billNumber || '');
    const m = bn.match(new RegExp(`^BILL-${y}-(\\d+)$`));
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `BILL-${y}-${pad4(max + 1)}`;
}

module.exports = { getNextRestaurantBillNumber };
