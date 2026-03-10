const parseAmount = (v) => {
  const n = parseFloat(v)
  return Number.isNaN(n) ? 0 : Math.round(n * 100) / 100
}

/**
 * Calculate commission amount for a rule and base amount.
 * @param {Object} rule - CommissionRule instance or plain object
 * @param {number} baseAmount
 */
const calculateCommission = (rule, baseAmount) => {
  const amt = parseAmount(baseAmount)
  if (!rule || !amt) {
    return { commissionAmount: 0 }
  }

  const type = rule.commissionType || rule.type
  const value = parseAmount(rule.value)

  let commissionAmount = 0
  if (type === 'PERCENT') {
    commissionAmount = (amt * value) / 100
  } else {
    commissionAmount = value
  }

  return {
    baseAmount: amt,
    commissionAmount: parseAmount(commissionAmount),
  }
}

module.exports = {
  calculateCommission,
  parseAmount,
}

