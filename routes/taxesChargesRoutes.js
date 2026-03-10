const express = require('express');
const { body, validationResult } = require('express-validator');

/**
 * Taxes & Charges routes (per-hotel, under /api/hotel-data/:hotelId/taxes-charges)
 */
module.exports = function createTaxesChargesRoutes(getHotelContext) {
  const router = express.Router({ mergeParams: true });

  // List all tax rules
  router.get('/rules', getHotelContext, async (req, res) => {
    try {
      const { TaxRule } = req.hotelModels;
      await TaxRule.sync();
      const rules = await TaxRule.findAll({
        order: [
          ['priority', 'ASC'],
          ['createdAt', 'DESC'],
        ],
      });
      res.json({ rules });
    } catch (error) {
      console.error('Get tax rules error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

  const ruleValidators = [
    body('name').trim().notEmpty().withMessage('Tax name is required'),
    body('type').isString().isIn(['GST', 'VAT', 'SERVICE', 'CITY']).withMessage('Invalid tax type'),
    body('percentage').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Percentage must be >= 0'),
    body('scope').isString().isIn(['rooms', 'services', 'both']).withMessage('Invalid scope'),
    body('cityTaxMode')
      .optional({ nullable: true })
      .isIn(['per_night', 'per_guest', 'fixed', null])
      .withMessage('Invalid cityTaxMode'),
    body('cityTaxAmount')
      .optional({ nullable: true })
      .isFloat({ min: 0 })
      .withMessage('City tax amount must be >= 0'),
    body('priority').optional().isInt({ min: 1 }).withMessage('Priority must be >= 1'),
    body('active').optional().isBoolean(),
  ];

  // Create tax rule
  router.post('/rules', getHotelContext, ruleValidators, async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { TaxRule } = req.hotelModels;
      await TaxRule.sync();

      const payload = {
        name: req.body.name,
        type: req.body.type,
        percentage: req.body.percentage ?? null,
        scope: req.body.scope,
        cityTaxMode: req.body.cityTaxMode ?? null,
        cityTaxAmount: req.body.cityTaxAmount ?? null,
        priority: req.body.priority || 1,
        active: req.body.active !== undefined ? !!req.body.active : true,
      };

      const rule = await TaxRule.create(payload);
      res.status(201).json({ rule });
    } catch (error) {
      console.error('Create tax rule error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

  // Update tax rule
  router.put('/rules/:id', getHotelContext, ruleValidators, async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { TaxRule } = req.hotelModels;
      await TaxRule.sync();
      const rule = await TaxRule.findByPk(req.params.id);
      if (!rule) {
        return res.status(404).json({ message: 'Tax rule not found' });
      }

      const updates = {
        name: req.body.name,
        type: req.body.type,
        percentage: req.body.percentage ?? null,
        scope: req.body.scope,
        cityTaxMode: req.body.cityTaxMode ?? null,
        cityTaxAmount: req.body.cityTaxAmount ?? null,
        priority: req.body.priority || rule.priority,
      };
      if (req.body.active !== undefined) {
        updates.active = !!req.body.active;
      }

      await rule.update(updates);
      res.json({ rule });
    } catch (error) {
      console.error('Update tax rule error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

  // Toggle status
  router.patch(
    '/rules/:id/status',
    getHotelContext,
    [body('active').isBoolean().withMessage('active must be boolean')],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        const { TaxRule } = req.hotelModels;
        await TaxRule.sync();
        const rule = await TaxRule.findByPk(req.params.id);
        if (!rule) {
          return res.status(404).json({ message: 'Tax rule not found' });
        }
        rule.active = !!req.body.active;
        await rule.save();
        res.json({ rule });
      } catch (error) {
        console.error('Toggle tax rule status error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
      }
    }
  );

  // Delete rule
  router.delete('/rules/:id', getHotelContext, async (req, res) => {
    try {
      const { TaxRule } = req.hotelModels;
      await TaxRule.sync();
      const rule = await TaxRule.findByPk(req.params.id);
      if (!rule) {
        return res.status(404).json({ message: 'Tax rule not found' });
      }
      await rule.destroy();
      res.status(204).send();
    } catch (error) {
      console.error('Delete tax rule error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

  return router;
};

