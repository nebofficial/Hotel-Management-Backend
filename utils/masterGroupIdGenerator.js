const { QueryTypes } = require('sequelize');

function pad4(n) {
  return String(n).padStart(4, '0');
}

/**
 * Generates next master group ID like GRP-2026-0001 (year-based sequence).
 */
async function getNextMasterGroupId(GroupBooking, year = new Date().getFullYear()) {
  const y = Number(year);
  const table = GroupBooking.getTableName();
  const schemaName = typeof table === 'object' && table.schema ? table.schema : undefined;
  const tableName = typeof table === 'object' && table.tableName ? table.tableName : table;

  if (!schemaName || !tableName) {
    // Fallback: query via ORM if we can't resolve table metadata
    const like = `GRP-${y}-%`;
    const rows = await GroupBooking.findAll({
      attributes: ['masterGroupId'],
      where: { masterGroupId: { [GroupBooking.sequelize.Sequelize.Op.like]: like } },
      order: [['createdAt', 'DESC']],
      limit: 500,
    });
    let max = 0;
    for (const r of rows) {
      const id = String(r.masterGroupId || '');
      const m = id.match(new RegExp(`^GRP-${y}-(\\d+)$`));
      if (m) max = Math.max(max, Number(m[1]));
    }
    return `GRP-${y}-${pad4(max + 1)}`;
  }

  const like = `GRP-${y}-%`;
  const regex = `GRP-${y}-(\\d+)$`;

  const result = await GroupBooking.sequelize.query(
    `
      SELECT COALESCE(
        MAX(CAST(substring("masterGroupId" from :regex) AS INTEGER)),
        0
      ) AS "maxSeq"
      FROM "${schemaName}"."${tableName}"
      WHERE "masterGroupId" LIKE :like
    `,
    {
      type: QueryTypes.SELECT,
      replacements: { like, regex },
    }
  );

  const maxSeq = result && result[0] && result[0].maxSeq != null ? Number(result[0].maxSeq) : 0;
  return `GRP-${y}-${pad4(maxSeq + 1)}`;
}

module.exports = { getNextMasterGroupId };

