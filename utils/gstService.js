function round2(n) {
  return Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;
}

/**
 * Splits GST into CGST/SGST (intra-state) or IGST (inter-state).
 * If states are missing, defaults to CGST/SGST split.
 */
function computeGstSplit({ taxableAmount, gstPercent, hotelState, placeOfSupplyState }) {
  const base = Number(taxableAmount || 0);
  const pct = Number(gstPercent || 0);
  const totalTax = round2((base * pct) / 100);

  const hs = (hotelState || '').toString().trim().toLowerCase();
  const ps = (placeOfSupplyState || '').toString().trim().toLowerCase();
  const isInterState = hs && ps ? hs !== ps : false;

  if (isInterState) {
    return { cgst: 0, sgst: 0, igst: totalTax, taxTotal: totalTax, isInterState };
  }

  const half = round2(totalTax / 2);
  const otherHalf = round2(totalTax - half);
  return { cgst: half, sgst: otherHalf, igst: 0, taxTotal: totalTax, isInterState };
}

module.exports = { computeGstSplit, round2 };

