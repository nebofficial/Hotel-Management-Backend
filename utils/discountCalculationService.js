/**
 * Calculate discount amount from subtotal using promo rules.
 */
function calculateDiscountAmount(options) {
  const opts = options || {};
  const subtotal = Number(opts.subtotal) || 0;
  if (subtotal <= 0) return 0;
  const minOrderValue = opts.minOrderValue != null ? Number(opts.minOrderValue) : null;
  if (minOrderValue != null && subtotal < minOrderValue) return 0;

  const discountType = opts.discountType || 'Percentage';
  const discountValue = Number(opts.discountValue) || 0;
  if (discountValue <= 0) return 0;

  let amount = 0;
  if (discountType === 'Percentage' || discountType === 'percentage') {
    amount = (subtotal * discountValue) / 100;
    const maxDiscountAmount = opts.maxDiscountAmount != null ? Number(opts.maxDiscountAmount) : null;
    if (maxDiscountAmount != null && maxDiscountAmount > 0) {
      amount = Math.min(amount, maxDiscountAmount);
    }
  } else {
    amount = Math.min(discountValue, subtotal);
  }

  return Math.round(amount * 100) / 100;
}

function isPromoValidForUse(options) {
  const opts = options || {};
  if (!opts.isActive) return false;
  const now = opts.currentDate instanceof Date ? opts.currentDate : new Date(opts.currentDate || Date.now());
  if (opts.startDate && new Date(opts.startDate) > now) return false;
  if (opts.endDate && new Date(opts.endDate) < now) return false;
  const used = Number(opts.usedCount || 0);
  const max = opts.maxUses != null ? Number(opts.maxUses) : null;
  if (max != null && max > 0 && used >= max) return false;
  return true;
}

module.exports = {
  calculateDiscountAmount,
  isPromoValidForUse,
};
