const { Op } = require('sequelize');

function parseDateOnly(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function buildWhereFromQuery(query) {
  const where = {};
  if (query.status) {
    const isActive = String(query.status).toLowerCase() === 'active';
    where.isActive = isActive;
  }
  if (query.ruleType && ['season', 'holiday', 'weekend', 'dynamic'].includes(query.ruleType)) {
    where.ruleType = query.ruleType;
  }
  if (query.date) {
    const d = parseDateOnly(query.date);
    if (d) {
      where.startDate = { [Op.lte]: d };
      where.endDate = { [Op.gte]: d };
    }
  }
  return where;
}

function mapRuleToDto(rule) {
  return {
    id: rule.id,
    name: rule.name,
    description: rule.description,
    startDate: rule.startDate,
    endDate: rule.endDate,
    roomTypes: rule.roomTypes || [],
    adjustmentPercent: rule.adjustmentPercent ? Number(rule.adjustmentPercent) : 0,
    adjustmentType: rule.adjustmentType,
    ruleType: rule.ruleType,
    weekendDays: rule.weekendDays || [],
    isActive: !!rule.isActive,
    metadata: rule.metadata || null,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
  };
}

exports.getSeasonalRules = async (req, res) => {
  try {
    const { SeasonalPricingRule } = req.hotelModels;
    await SeasonalPricingRule.sync({ alter: false });

    const where = buildWhereFromQuery(req.query || {});
    const rules = await SeasonalPricingRule.findAll({
      where,
      order: [
        ['isActive', 'DESC'],
        ['startDate', 'ASC'],
      ],
    });

    res.json({ items: rules.map(mapRuleToDto) });
  } catch (error) {
    console.error('getSeasonalRules error:', error);
    res.status(500).json({ message: 'Failed to load seasonal pricing rules', error: error.message });
  }
};

exports.createSeasonRule = async (req, res) => {
  try {
    const { SeasonalPricingRule } = req.hotelModels;
    await SeasonalPricingRule.sync({ alter: false });

    const {
      name,
      description,
      startDate,
      endDate,
      roomTypes,
      adjustmentPercent,
      adjustmentType = 'increase',
      ruleType = 'season',
      weekendDays,
      isActive = true,
      metadata,
    } = req.body || {};

    if (!name || !startDate || !endDate || !adjustmentPercent) {
      return res
        .status(400)
        .json({ message: 'Name, date range and price adjustment are required' });
    }

    const start = parseDateOnly(startDate);
    const end = parseDateOnly(endDate);
    if (!start || !end) {
      return res.status(400).json({ message: 'Invalid start or end date' });
    }
    if (new Date(start) > new Date(end)) {
      return res.status(400).json({ message: 'Start date must be before end date' });
    }

    const pct = Number(adjustmentPercent || 0) || 0;
    if (!pct) {
      return res.status(400).json({ message: 'Adjustment percent must be greater than zero' });
    }

    const normalizedRoomTypes = Array.isArray(roomTypes)
      ? roomTypes.map((rt) => String(rt).trim()).filter(Boolean)
      : String(roomTypes || '')
          .split(',')
          .map((rt) => rt.trim())
          .filter(Boolean);

    const rule = await SeasonalPricingRule.create({
      name: String(name).trim(),
      description: description || null,
      startDate: start,
      endDate: end,
      roomTypes: normalizedRoomTypes,
      adjustmentPercent: pct,
      adjustmentType: adjustmentType === 'discount' ? 'discount' : 'increase',
      ruleType: ['season', 'holiday', 'weekend', 'dynamic'].includes(ruleType)
        ? ruleType
        : 'season',
      weekendDays:
        Array.isArray(weekendDays) && weekendDays.length
          ? weekendDays.map((d) => String(d).toLowerCase())
          : null,
      isActive: !!isActive,
      metadata: metadata || null,
      createdBy: req.user?.name || req.user?.id || null,
      updatedBy: req.user?.name || req.user?.id || null,
    });

    res.status(201).json({ rule: mapRuleToDto(rule) });
  } catch (error) {
    console.error('createSeasonRule error:', error);
    res.status(500).json({ message: 'Failed to create seasonal pricing rule', error: error.message });
  }
};

exports.updateSeasonRule = async (req, res) => {
  try {
    const { SeasonalPricingRule } = req.hotelModels;
    await SeasonalPricingRule.sync({ alter: false });

    const rule = await SeasonalPricingRule.findByPk(req.params.id);
    if (!rule) {
      return res.status(404).json({ message: 'Seasonal pricing rule not found' });
    }

    const {
      name,
      description,
      startDate,
      endDate,
      roomTypes,
      adjustmentPercent,
      adjustmentType,
      ruleType,
      weekendDays,
      isActive,
      metadata,
    } = req.body || {};

    if (name !== undefined) rule.name = String(name).trim();
    if (description !== undefined) rule.description = description || null;
    if (startDate !== undefined || endDate !== undefined) {
      const start = parseDateOnly(startDate || rule.startDate);
      const end = parseDateOnly(endDate || rule.endDate);
      if (!start || !end) {
        return res.status(400).json({ message: 'Invalid start or end date' });
      }
      if (new Date(start) > new Date(end)) {
        return res.status(400).json({ message: 'Start date must be before end date' });
      }
      rule.startDate = start;
      rule.endDate = end;
    }
    if (roomTypes !== undefined) {
      rule.roomTypes = Array.isArray(roomTypes)
        ? roomTypes.map((rt) => String(rt).trim()).filter(Boolean)
        : String(roomTypes || '')
            .split(',')
            .map((rt) => rt.trim())
            .filter(Boolean);
    }
    if (adjustmentPercent !== undefined) {
      const pct = Number(adjustmentPercent || 0) || 0;
      if (!pct) {
        return res
          .status(400)
          .json({ message: 'Adjustment percent must be greater than zero' });
      }
      rule.adjustmentPercent = pct;
    }
    if (adjustmentType !== undefined) {
      rule.adjustmentType = adjustmentType === 'discount' ? 'discount' : 'increase';
    }
    if (ruleType !== undefined) {
      if (['season', 'holiday', 'weekend', 'dynamic'].includes(ruleType)) {
        rule.ruleType = ruleType;
      }
    }
    if (weekendDays !== undefined) {
      rule.weekendDays =
        Array.isArray(weekendDays) && weekendDays.length
          ? weekendDays.map((d) => String(d).toLowerCase())
          : null;
    }
    if (isActive !== undefined) {
      rule.isActive = !!isActive;
    }
    if (metadata !== undefined) {
      rule.metadata = metadata || null;
    }

    rule.updatedBy = req.user?.name || req.user?.id || null;
    await rule.save();

    res.json({ rule: mapRuleToDto(rule) });
  } catch (error) {
    console.error('updateSeasonRule error:', error);
    res.status(500).json({ message: 'Failed to update seasonal pricing rule', error: error.message });
  }
};

exports.deleteSeasonRule = async (req, res) => {
  try {
    const { SeasonalPricingRule } = req.hotelModels;
    await SeasonalPricingRule.sync({ alter: false });

    const rule = await SeasonalPricingRule.findByPk(req.params.id);
    if (!rule) {
      return res.status(404).json({ message: 'Seasonal pricing rule not found' });
    }

    await rule.destroy();
    res.json({ success: true });
  } catch (error) {
    console.error('deleteSeasonRule error:', error);
    res.status(500).json({ message: 'Failed to delete seasonal pricing rule', error: error.message });
  }
};

exports.assignSeasonRuleToRoomType = async (req, res) => {
  try {
    const { SeasonalPricingRule } = req.hotelModels;
    await SeasonalPricingRule.sync({ alter: false });

    const rule = await SeasonalPricingRule.findByPk(req.params.id);
    if (!rule) {
      return res.status(404).json({ message: 'Seasonal pricing rule not found' });
    }

    const { roomTypes } = req.body || {};
    const normalized = Array.isArray(roomTypes)
      ? roomTypes.map((rt) => String(rt).trim()).filter(Boolean)
      : String(roomTypes || '')
          .split(',')
          .map((rt) => rt.trim())
          .filter(Boolean);

    rule.roomTypes = normalized;
    rule.updatedBy = req.user?.name || req.user?.id || null;
    await rule.save();

    res.json({ rule: mapRuleToDto(rule) });
  } catch (error) {
    console.error('assignSeasonRuleToRoomType error:', error);
    res.status(500).json({
      message: 'Failed to assign room types to seasonal pricing rule',
      error: error.message,
    });
  }
};

