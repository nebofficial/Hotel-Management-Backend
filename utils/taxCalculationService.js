/**
 * Basic tax calculation helper.
 * This is intentionally generic and rule-based so it can be
 * reused by billing services later without changing API routes.
 */

/**
 * Calculate taxes for a given base amount using an array of TaxRule-like objects.
 * @param {number} baseAmount
 * @param {Array<{ id?: string, type: string, percentage?: number, cityTaxMode?: string, cityTaxAmount?: number, active?: boolean }>} rules
 * @returns {{ totalTax: number, breakdown: Array<{ ruleId?: string, type: string, amount: number }> }}
 */
function calculateTaxes(baseAmount, rules) {
  const safeAmount = Number(baseAmount || 0);
  if (!Array.isArray(rules) || safeAmount <= 0) {
    return { totalTax: 0, breakdown: [] };
  }

  const breakdown = [];
  let totalTax = 0;

  for (const rule of rules) {
    if (!rule || rule.active === false) continue;

    let amount = 0;
    if (rule.type === 'CITY' && rule.cityTaxMode && rule.cityTaxAmount != null) {
      // For now we don't know nights/guests, so treat as a flat fee per invoice
      amount = Number(rule.cityTaxAmount || 0);
    } else if (rule.percentage != null) {
      amount = (safeAmount * Number(rule.percentage || 0)) / 100;
    }

    if (amount > 0) {
      totalTax += amount;
      breakdown.push({
        ruleId: rule.id,
        type: rule.type,
        amount,
      });
    }
  }

  return { totalTax, breakdown };
}

module.exports = {
  calculateTaxes,
};

