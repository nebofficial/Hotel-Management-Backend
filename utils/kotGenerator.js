const { Op } = require('sequelize');

function pad4(n) {
  return String(n).padStart(4, '0');
}

/**
 * Generates next KOT number like KOT-2026-0001
 */
async function getNextKOTNumber(KitchenKOT, year = new Date().getFullYear()) {
  const y = Number(year);
  const like = `KOT-${y}-%`;
  const rows = await KitchenKOT.findAll({
    attributes: ['kotNumber'],
    where: { kotNumber: { [Op.like]: like } },
    order: [['createdAt', 'DESC']],
    limit: 500,
  });
  let max = 0;
  for (const r of rows) {
    const kn = String(r.kotNumber || '');
    const m = kn.match(new RegExp(`^KOT-${y}-(\\d+)$`));
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `KOT-${y}-${pad4(max + 1)}`;
}

/**
 * Build KOT items from bill items for kitchen display
 */
function buildKOTItems(billItems) {
  return (billItems || []).map((item) => ({
    id: item.id,
    name: item.name || item.menuItemName || 'Unknown',
    quantity: Number(item.quantity) || 1,
    section: item.section || 'Main',
    notes: item.notes || '',
    status: 'Pending',
    preparationTime: null,
  }));
}

module.exports = { getNextKOTNumber, buildKOTItems };
