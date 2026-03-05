const { QueryTypes } = require('sequelize');
const { Op } = require('sequelize');

function pad4(n) {
  return String(n).padStart(4, '0');
}

/**
 * Generates next reservation number like RES-2026-0001 (year-based sequence).
 * Uses max existing number in bookings table for the given year.
 */
async function getNextReservationNumber(Booking, year = new Date().getFullYear()) {
  const y = Number(year);
  const table = Booking.getTableName();
  const schemaName = typeof table === 'object' && table.schema ? table.schema : undefined;
  const tableName = typeof table === 'object' && table.tableName ? table.tableName : table;

  // Fallback: if schema/table can't be determined, do a safer (but slower) approach
  if (!schemaName || !tableName) {
    const like = `RES-${y}-%`;
    const rows = await Booking.findAll({
      attributes: ['bookingNumber'],
      where: { bookingNumber: { [Op.like]: like } },
      order: [['createdAt', 'DESC']],
      limit: 500,
    });
    let max = 0;
    for (const r of rows) {
      const bn = String(r.bookingNumber || '');
      const m = bn.match(new RegExp(`^RES-${y}-(\\d+)$`));
      if (m) max = Math.max(max, Number(m[1]));
    }
    return `RES-${y}-${pad4(max + 1)}`;
  }

  const like = `RES-${y}-%`;
  const regex = `RES-${y}-(\\d+)$`;

  const result = await Booking.sequelize.query(
    `
      SELECT COALESCE(
        MAX(CAST(substring("bookingNumber" from :regex) AS INTEGER)),
        0
      ) AS "maxSeq"
      FROM "${schemaName}"."${tableName}"
      WHERE "bookingNumber" LIKE :like
    `,
    {
      type: QueryTypes.SELECT,
      replacements: { like, regex },
    }
  );

  const maxSeq = result && result[0] && result[0].maxSeq != null ? Number(result[0].maxSeq) : 0;
  return `RES-${y}-${pad4(maxSeq + 1)}`;
}

module.exports = { getNextReservationNumber };

