const { Op } = require('sequelize');
const {
  normalizeStayLimits,
  normalizeNonRefundableDiscount,
} = require('../utils/pricingRulesService');

function buildWhereFromQuery(query) {
  const where = {};
  if (query.status && ['active', 'inactive'].includes(query.status)) {
    where.status = query.status;
  }
  if (query.name) {
    where.name = {
      [Op.iLike]: `%${query.name}%`,
    };
  }
  return where;
}

function mapRatePlanToDto(plan) {
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    roomTypes: plan.roomTypes || [],
    basePrice: Number(plan.basePrice || 0),
    mealPlan: plan.mealPlan,
    isRefundable: !!plan.isRefundable,
    nonRefundableDiscountPercent: plan.nonRefundableDiscountPercent
      ? Number(plan.nonRefundableDiscountPercent)
      : null,
    minStayNights: plan.minStayNights,
    maxStayNights: plan.maxStayNights,
    weekendRule: plan.weekendRule || null,
    seasonalRules: plan.seasonalRules || null,
    status: plan.status,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };
}

exports.getRatePlans = async (req, res) => {
  try {
    const { RatePlan } = req.hotelModels;
    await RatePlan.sync({ alter: false });

    const where = buildWhereFromQuery(req.query || {});
    const plans = await RatePlan.findAll({
      where,
      order: [
        ['status', 'DESC'],
        ['name', 'ASC'],
      ],
    });

    res.json({
      items: plans.map(mapRatePlanToDto),
    });
  } catch (error) {
    console.error('getRatePlans error:', error);
    res.status(500).json({ message: 'Failed to load rate plans', error: error.message });
  }
};

exports.createRatePlan = async (req, res) => {
  try {
    const { RatePlan } = req.hotelModels;
    await RatePlan.sync({ alter: false });

    const {
      name,
      description,
      roomTypes = [],
      basePrice,
      mealPlan = 'room_only',
      isRefundable = true,
      nonRefundableDiscountPercent,
      minStayNights,
      maxStayNights,
      weekendRule,
      seasonalRules,
    } = req.body || {};

    if (!name || !basePrice) {
      return res.status(400).json({ message: 'Name and base price are required' });
    }

    const numericBasePrice = Number(basePrice || 0) || 0;
    if (numericBasePrice <= 0) {
      return res.status(400).json({ message: 'Base price must be greater than zero' });
    }

    const stayLimits = normalizeStayLimits(minStayNights, maxStayNights);
    const discount = normalizeNonRefundableDiscount(isRefundable, nonRefundableDiscountPercent);

    const plan = await RatePlan.create({
      name: String(name).trim(),
      description: description || null,
      roomTypes: Array.isArray(roomTypes)
        ? roomTypes.map((rt) => String(rt).trim()).filter(Boolean)
        : String(roomTypes || '')
            .split(',')
            .map((rt) => rt.trim())
            .filter(Boolean),
      basePrice: numericBasePrice,
      mealPlan,
      isRefundable: !!isRefundable,
      nonRefundableDiscountPercent: discount,
      minStayNights: stayLimits.minStayNights,
      maxStayNights: stayLimits.maxStayNights,
      weekendRule: weekendRule || null,
      seasonalRules: seasonalRules || null,
      status: 'active',
      createdBy: req.user?.name || req.user?.id || null,
      updatedBy: req.user?.name || req.user?.id || null,
    });

    res.status(201).json({ plan: mapRatePlanToDto(plan) });
  } catch (error) {
    console.error('createRatePlan error:', error);
    res.status(500).json({ message: 'Failed to create rate plan', error: error.message });
  }
};

exports.updateRatePlan = async (req, res) => {
  try {
    const { RatePlan } = req.hotelModels;
    await RatePlan.sync({ alter: false });

    const plan = await RatePlan.findByPk(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Rate plan not found' });
    }

    const {
      name,
      description,
      roomTypes,
      basePrice,
      mealPlan,
      isRefundable,
      nonRefundableDiscountPercent,
      minStayNights,
      maxStayNights,
      weekendRule,
      seasonalRules,
      status,
    } = req.body || {};

    if (name !== undefined) plan.name = String(name).trim();
    if (description !== undefined) plan.description = description || null;
    if (roomTypes !== undefined) {
      plan.roomTypes = Array.isArray(roomTypes)
        ? roomTypes.map((rt) => String(rt).trim()).filter(Boolean)
        : String(roomTypes || '')
            .split(',')
            .map((rt) => rt.trim())
            .filter(Boolean);
    }
    if (basePrice !== undefined) {
      const numericBasePrice = Number(basePrice || 0) || 0;
      if (numericBasePrice <= 0) {
        return res.status(400).json({ message: 'Base price must be greater than zero' });
      }
      plan.basePrice = numericBasePrice;
    }
    if (mealPlan !== undefined) plan.mealPlan = mealPlan;
    if (isRefundable !== undefined) plan.isRefundable = !!isRefundable;
    if (minStayNights !== undefined || maxStayNights !== undefined) {
      const limits = normalizeStayLimits(
        minStayNights ?? plan.minStayNights,
        maxStayNights ?? plan.maxStayNights,
      );
      plan.minStayNights = limits.minStayNights;
      plan.maxStayNights = limits.maxStayNights;
    }
    if (nonRefundableDiscountPercent !== undefined || isRefundable !== undefined) {
      plan.nonRefundableDiscountPercent = normalizeNonRefundableDiscount(
        plan.isRefundable,
        nonRefundableDiscountPercent ?? plan.nonRefundableDiscountPercent,
      );
    }
    if (weekendRule !== undefined) plan.weekendRule = weekendRule || null;
    if (seasonalRules !== undefined) plan.seasonalRules = seasonalRules || null;
    if (status && ['active', 'inactive'].includes(status)) {
      plan.status = status;
    }

    plan.updatedBy = req.user?.name || req.user?.id || null;

    await plan.save();

    res.json({ plan: mapRatePlanToDto(plan) });
  } catch (error) {
    console.error('updateRatePlan error:', error);
    res.status(500).json({ message: 'Failed to update rate plan', error: error.message });
  }
};

exports.assignRatePlanToRoomType = async (req, res) => {
  try {
    const { RatePlan } = req.hotelModels;
    await RatePlan.sync({ alter: false });

    const plan = await RatePlan.findByPk(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Rate plan not found' });
    }

    const { roomTypes } = req.body || {};
    const newRoomTypes = Array.isArray(roomTypes)
      ? roomTypes.map((rt) => String(rt).trim()).filter(Boolean)
      : String(roomTypes || '')
          .split(',')
          .map((rt) => rt.trim())
          .filter(Boolean);

    plan.roomTypes = newRoomTypes;
    plan.updatedBy = req.user?.name || req.user?.id || null;
    await plan.save();

    res.json({ plan: mapRatePlanToDto(plan) });
  } catch (error) {
    console.error('assignRatePlanToRoomType error:', error);
    res
      .status(500)
      .json({ message: 'Failed to assign room types to rate plan', error: error.message });
  }
};

exports.toggleRatePlanStatus = async (req, res) => {
  try {
    const { RatePlan } = req.hotelModels;
    await RatePlan.sync({ alter: false });

    const plan = await RatePlan.findByPk(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Rate plan not found' });
    }

    plan.status = plan.status === 'active' ? 'inactive' : 'active';
    plan.updatedBy = req.user?.name || req.user?.id || null;
    await plan.save();

    res.json({ plan: mapRatePlanToDto(plan) });
  } catch (error) {
    console.error('toggleRatePlanStatus error:', error);
    res.status(500).json({ message: 'Failed to toggle rate plan status', error: error.message });
  }
};

exports.exportRatePlans = async (req, res) => {
  try {
    const { RatePlan } = req.hotelModels;
    await RatePlan.sync({ alter: false });

    const where = buildWhereFromQuery(req.query || {});
    const plans = await RatePlan.findAll({
      where,
      order: [['name', 'ASC']],
    });

    res.json({
      items: plans.map(mapRatePlanToDto),
    });
  } catch (error) {
    console.error('exportRatePlans error:', error);
    res.status(500).json({ message: 'Failed to export rate plans', error: error.message });
  }
};

