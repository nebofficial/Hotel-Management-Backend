/**
 * GST calculation for restaurant bills
 * Supports CGST + SGST (split) or single GST rate
 */
function calculateGST(
  taxableAmount,
  gstRatePercent = 12,
  serviceChargePercent = 0,
  roundToNearest = 1
) {
  const taxable = Number(taxableAmount) || 0;
  const gstRate = Number(gstRatePercent) || 0;
  const svcRate = Number(serviceChargePercent) || 0;

  const totalGst = (taxable * gstRate) / 100;
  const cgst = totalGst / 2;
  const sgst = totalGst / 2;
  const serviceCharge = (taxable * svcRate) / 100;

  let grossTotal = taxable + totalGst + serviceCharge;
  const rounded = Math.round(grossTotal / roundToNearest) * roundToNearest;
  const roundOff = roundToNearest - roundToNearest === 0 ? 0 : rounded - grossTotal;

  return {
    taxableAmount: taxable,
    cgst,
    sgst,
    totalTax: totalGst,
    serviceCharge,
    grossTotal: rounded,
    roundOff: roundOff || rounded - grossTotal,
  };
}

module.exports = { calculateGST };
