function safeNumber(v) {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

/**
 * Consolidate tax breakdowns coming from room bills + restaurant bills + other charges.
 * Each item can optionally include:
 *  - taxableAmount
 *  - cgst
 *  - sgst
 *  - igst
 *  - serviceCharge
 *  - roundOff
 *  - grossTotal
 */
function consolidateTax(breakdowns = []) {
  const result = {
    taxableAmount: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    serviceCharge: 0,
    roundOff: 0,
    grossTotal: 0,
  };

  for (const b of breakdowns || []) {
    if (!b) continue;
    result.taxableAmount += safeNumber(b.taxableAmount);
    result.cgst += safeNumber(b.cgst);
    result.sgst += safeNumber(b.sgst);
    result.igst += safeNumber(b.igst);
    result.serviceCharge += safeNumber(b.serviceCharge);
    result.roundOff += safeNumber(b.roundOff);
    result.grossTotal += safeNumber(b.grossTotal);
  }

  // Round to 2 decimals for display
  Object.keys(result).forEach((k) => {
    result[k] = Math.round(result[k] * 100) / 100;
  });

  return result;
}

module.exports = { consolidateTax };

