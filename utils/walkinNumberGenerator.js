const { QueryTypes, Op } = require('sequelize');

function pad4(n) {
  return String(n).padStart(4, '0');
}

/**
 * Generates next walk-in number like WIN-2026-0001 (year-based sequence).
 */
async function getNextWalkinNumber(WalkinBooking, year = new Date().getFullYear()) {
  const y = Number(year);
  const table = WalkinBooking.getTableName();
  const schemaName = typeof table === 'object' && table.schema ? table.schema : undefined;
  const tableName = typeof table === 'object' && table.tableName ? table.tableName : table;

  if (!schemaName || !tableName) {
    const like = `WIN-${y}-%`;
    const rows = await WalkinBooking.findAll({
      attributes: ['walkinNumber'],
      where: { walkinNumber: { [Op.like]: like } },
      order: [['createdAt', 'DESC']],
      limit: 500,
    });
    let max = 0;
    for (const r of rows) {
      const wn = String(r.walkinNumber || '');
      const m = wn.match(new RegExp(`^WIN-${y}-(\\d+)$`));
      if (m) max = Math.max(max, Number(m[1]));
    }
    return `WIN-${y}-${pad4(max + 1)}`;
  }

  const like = `WIN-${y}-%`;
  const regex = `WIN-${y}-(\\d+)$`;

  const result = await WalkinBooking.sequelize.query(
    `
      SELECT COALESCE(
        MAX(CAST(substring("walkinNumber" from :regex) AS INTEGER)),
        0
      ) AS "maxSeq"
      FROM "${schemaName}"."${tableName}"
      WHERE "walkinNumber" LIKE :like
    `,
    {
      type: QueryTypes.SELECT,
      replacements: { like, regex },
    }
  );

  const maxSeq = result && result[0] && result[0].maxSeq != null ? Number(result[0].maxSeq) : 0;
  return `WIN-${y}-${pad4(maxSeq + 1)}`;
}

/**
 * Generates bill number like BILL-2026-0001 (year-based sequence).
 */
async function getNextBillNumber(WalkinBooking, year = new Date().getFullYear()) {
  const y = Number(year);
  const table = WalkinBooking.getTableName();
  const schemaName = typeof table === 'object' && table.schema ? table.schema : undefined;
  const tableName = typeof table === 'object' && table.tableName ? table.tableName : table;

  if (!schemaName || !tableName) {
    const like = `BILL-${y}-%`;
    const rows = await WalkinBooking.findAll({
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

  const like = `BILL-${y}-%`;
  const regex = `BILL-${y}-(\\d+)$`;

  const result = await WalkinBooking.sequelize.query(
    `
      SELECT COALESCE(
        MAX(CAST(substring("billNumber" from :regex) AS INTEGER)),
        0
      ) AS "maxSeq"
      FROM "${schemaName}"."${tableName}"
      WHERE "billNumber" LIKE :like
    `,
    {
      type: QueryTypes.SELECT,
      replacements: { like, regex },
    }
  );

  const maxSeq = result && result[0] && result[0].maxSeq != null ? Number(result[0].maxSeq) : 0;
  return `BILL-${y}-${pad4(maxSeq + 1)}`;
}

module.exports = { getNextWalkinNumber, getNextBillNumber };
