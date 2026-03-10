const { Op } = require('sequelize');

function mapCouponToPromo(c) {
  const roomTypes = Array.isArray(c.applicableCategories) ? c.applicableCategories : [];
  return {
    id: c.id,
    code: c.code,
    name: c.name,
    description: c.description,
    discountType: c.discountType === 'Flat' ? 'fixed' : 'percentage',
    discountValue: Number(c.discountValue || 0),
    minOrderValue: c.minOrderValue != null ? Number(c.minOrderValue) : null,
    maxDiscountAmount: c.maxDiscountAmount != null ? Number(c.maxDiscountAmount) : null,
    maxUses: c.maxUses != null ? Number(c.maxUses) : null,
    usedCount: Number(c.usedCount || 0),
    maxUsesPerUser: c.maxUsesPerUser != null ? Number(c.maxUsesPerUser) : null,
    startDate: c.startDate ? (typeof c.startDate === 'string' ? c.startDate : c.startDate.toISOString?.().slice(0, 10)) : null,
    endDate: c.endDate ? (typeof c.endDate === 'string' ? c.endDate : c.endDate.toISOString?.().slice(0, 10)) : null,
    roomTypes,
    isActive: !!c.isActive,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

function buildWhere(req) {
  const where = {};
  if (req.query.isActive !== undefined) {
    where.isActive = req.query.isActive === 'true';
  }
  if (req.query.code) {
    where.code = { [Op.iLike]: `%${req.query.code}%` };
  }
  return where;
}

exports.getPromoCodes = async (req, res) => {
  try {
    const { CouponCode } = req.hotelModels;
    await CouponCode.sync({ alter: false });
    const where = buildWhere(req);
    const list = await CouponCode.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
    res.json({ items: list.map(mapCouponToPromo) });
  } catch (error) {
    console.error('getPromoCodes error:', error);
    res.status(500).json({ message: 'Failed to load promo codes', error: error.message });
  }
};

exports.createPromoCode = async (req, res) => {
  try {
    const { CouponCode } = req.hotelModels;
    await CouponCode.sync({ alter: false });

    const {
      code,
      name,
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscountAmount,
      maxUses,
      maxUsesPerUser,
      startDate,
      endDate,
      roomTypes,
      isActive = true,
    } = req.body || {};

    if (!code || !name) {
      return res.status(400).json({ message: 'Code and name are required' });
    }
    const dType = discountType === 'fixed' ? 'Flat' : 'Percentage';
    const val = Number(discountValue);
    if (!Number.isFinite(val) || val <= 0) {
      return res.status(400).json({ message: 'Valid discount value is required' });
    }

    const roomTypesArr = Array.isArray(roomTypes) ? roomTypes : (roomTypes ? String(roomTypes).split(',').map((r) => r.trim()).filter(Boolean) : []);

    const coupon = await CouponCode.create({
      code: String(code).trim().toUpperCase(),
      name: String(name).trim(),
      description: description || null,
      discountType: dType,
      discountValue: val,
      minOrderValue: minOrderValue != null ? Number(minOrderValue) : null,
      maxDiscountAmount: maxDiscountAmount != null ? Number(maxDiscountAmount) : null,
      maxUses: maxUses != null ? Number(maxUses) : null,
      usedCount: 0,
      maxUsesPerUser: maxUsesPerUser != null ? Number(maxUsesPerUser) : 1,
      isActive: !!isActive,
      startDate: startDate || null,
      endDate: endDate || null,
      applicableCategories: roomTypesArr.length ? roomTypesArr : null,
    });

    res.status(201).json({ promo: mapCouponToPromo(coupon) });
  } catch (error) {
    console.error('createPromoCode error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Promo code already exists' });
    }
    res.status(500).json({ message: 'Failed to create promo code', error: error.message });
  }
};

exports.updatePromoCode = async (req, res) => {
  try {
    const { CouponCode } = req.hotelModels;
    await CouponCode.sync({ alter: false });
    const coupon = await CouponCode.findByPk(req.params.id);
    if (!coupon) return res.status(404).json({ message: 'Promo code not found' });

    const {
      code,
      name,
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscountAmount,
      maxUses,
      maxUsesPerUser,
      startDate,
      endDate,
      roomTypes,
      isActive,
    } = req.body || {};

    if (code !== undefined) coupon.code = String(code).trim().toUpperCase();
    if (name !== undefined) coupon.name = String(name).trim();
    if (description !== undefined) coupon.description = description || null;
    if (discountType !== undefined) coupon.discountType = discountType === 'fixed' ? 'Flat' : 'Percentage';
    if (discountValue !== undefined) {
      const v = Number(discountValue);
      if (!Number.isFinite(v) || v <= 0) return res.status(400).json({ message: 'Valid discount value is required' });
      coupon.discountValue = v;
    }
    if (minOrderValue !== undefined) coupon.minOrderValue = minOrderValue != null ? Number(minOrderValue) : null;
    if (maxDiscountAmount !== undefined) coupon.maxDiscountAmount = maxDiscountAmount != null ? Number(maxDiscountAmount) : null;
    if (maxUses !== undefined) coupon.maxUses = maxUses != null ? Number(maxUses) : null;
    if (maxUsesPerUser !== undefined) coupon.maxUsesPerUser = maxUsesPerUser != null ? Number(maxUsesPerUser) : null;
    if (startDate !== undefined) coupon.startDate = startDate || null;
    if (endDate !== undefined) coupon.endDate = endDate || null;
    if (roomTypes !== undefined) {
      coupon.applicableCategories = Array.isArray(roomTypes) ? roomTypes : (roomTypes ? String(roomTypes).split(',').map((r) => r.trim()).filter(Boolean) : null);
    }
    if (isActive !== undefined) coupon.isActive = !!isActive;

    await coupon.save();
    res.json({ promo: mapCouponToPromo(coupon) });
  } catch (error) {
    console.error('updatePromoCode error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Promo code already exists' });
    }
    res.status(500).json({ message: 'Failed to update promo code', error: error.message });
  }
};

exports.togglePromoStatus = async (req, res) => {
  try {
    const { CouponCode } = req.hotelModels;
    const coupon = await CouponCode.findByPk(req.params.id);
    if (!coupon) return res.status(404).json({ message: 'Promo code not found' });
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    res.json({ promo: mapCouponToPromo(coupon) });
  } catch (error) {
    console.error('togglePromoStatus error:', error);
    res.status(500).json({ message: 'Failed to toggle promo status', error: error.message });
  }
};

exports.getPromoAnalytics = async (req, res) => {
  try {
    const { CouponCode } = req.hotelModels;
    await CouponCode.sync({ alter: false });
    const list = await CouponCode.findAll({ order: [['usedCount', 'DESC']] });

    const activeCount = list.filter((c) => c.isActive).length;
    let totalDiscountGiven = 0;
    let totalPromoBookings = 0;
    list.forEach((c) => {
      const used = Number(c.usedCount || 0);
      totalPromoBookings += used;
      if (c.discountType === 'Flat') {
        totalDiscountGiven += Number(c.discountValue || 0) * used;
      }
      // Percentage: we don't have per-booking amount; could approximate later
    });

    const byCode = list.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      usedCount: Number(c.usedCount || 0),
      discountType: c.discountType,
      discountValue: Number(c.discountValue || 0),
      isActive: !!c.isActive,
    }));

    res.json({
      activePromoCodes: activeCount,
      totalDiscountGiven: Math.round(totalDiscountGiven * 100) / 100,
      totalPromoBookings,
      averageDiscountValue: totalPromoBookings > 0 ? Math.round((totalDiscountGiven / totalPromoBookings) * 100) / 100 : 0,
      byCode,
    });
  } catch (error) {
    console.error('getPromoAnalytics error:', error);
    res.status(500).json({ message: 'Failed to load promo analytics', error: error.message });
  }
};

exports.validatePromoCode = async (req, res) => {
  try {
    const { CouponCode } = req.hotelModels;
    const code = String(req.query.code || req.body?.code || '').trim().toUpperCase();
    if (!code) return res.status(400).json({ message: 'Promo code is required' });

    const coupon = await CouponCode.findOne({ where: { code } });
    if (!coupon) return res.json({ valid: false, message: 'Invalid promo code' });
    if (!coupon.isActive) return res.json({ valid: false, message: 'Promo code is inactive' });

    const now = new Date();
    if (coupon.startDate && new Date(coupon.startDate) > now) return res.json({ valid: false, message: 'Promo not yet active' });
    if (coupon.endDate && new Date(coupon.endDate) < now) return res.json({ valid: false, message: 'Promo has expired' });
    if (coupon.maxUses != null && coupon.maxUses > 0 && Number(coupon.usedCount || 0) >= coupon.maxUses) {
      return res.json({ valid: false, message: 'Usage limit reached' });
    }

    const { calculateDiscountAmount } = require('../utils/discountCalculationService');
    const subtotal = Number(req.query.subtotal || req.body?.subtotal || 0);
    const discountAmount = calculateDiscountAmount({
      subtotal,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscountAmount: coupon.maxDiscountAmount,
      minOrderValue: coupon.minOrderValue,
    });

    res.json({
      valid: true,
      promo: mapCouponToPromo(coupon),
      discountAmount,
      message: 'Valid',
    });
  } catch (error) {
    console.error('validatePromoCode error:', error);
    res.status(500).json({ message: 'Failed to validate promo code', error: error.message });
  }
};
