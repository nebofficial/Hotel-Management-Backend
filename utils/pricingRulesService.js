function normalizeStayLimits(minStayNights, maxStayNights) {
  const min = Number(minStayNights || 0) || 0;
  const max = Number(maxStayNights || 0) || null;

  if (max !== null && max > 0 && max < min) {
    return { minStayNights: max, maxStayNights: min };
  }
  return {
    minStayNights: min > 0 ? min : null,
    maxStayNights: max && max > 0 ? max : null,
  };
}

function normalizeNonRefundableDiscount(isRefundable, discountPercent) {
  if (isRefundable) return null;
  const v = Number(discountPercent || 0) || 0;
  if (v <= 0) return null;
  return Math.min(90, Math.max(0, v));
}

module.exports = {
  normalizeStayLimits,
  normalizeNonRefundableDiscount,
};

