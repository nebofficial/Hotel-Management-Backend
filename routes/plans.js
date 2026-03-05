const express = require('express');
const { body, validationResult } = require('express-validator');
const { Plan, Hotel } = require('../models');
const { authenticate, requireSuperAdmin } = require('../middleware/auth');
const { Sequelize } = require('sequelize');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/plans
 * @desc    Get all plans
 * @access  Private (Super Admin only)
 */
router.get('/', requireSuperAdmin, async (req, res) => {
  try {
    const plans = await Plan.findAll({
      order: [['createdAt', 'DESC']],
    });
    res.json({ plans });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/plans/:id
 * @desc    Get single plan
 * @access  Private (Super Admin or Hotel Admin accessing their hotel's plan)
 */
router.get('/:id', async (req, res) => {
  try {
    // Validate that id is a valid UUID
    const planId = req.params.id;
    
    // Check if planId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(planId)) {
      return res.status(400).json({ message: 'Invalid plan ID format' });
    }
    
    const plan = await Plan.findByPk(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    
    // Allow hotel admin to access their hotel's plan
    if (req.user.role !== 'super_admin' && req.user.hotelId) {
      const hotel = await Hotel.findByPk(req.user.hotelId);
      if (!hotel || hotel.planId?.toString() !== planId) {
        return res.status(403).json({ message: 'Access denied. You can only access your hotel\'s plan.' });
      }
    } else if (req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json({ plan });
  } catch (error) {
    console.error('Get plan error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/plans
 * @desc    Create new plan
 * @access  Private (Super Admin only)
 */
router.post(
  '/',
  requireSuperAdmin,
  [
    body('name').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('permissions').isArray(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, permissions } = req.body;

      // Check if plan already exists
      const existingPlan = await Plan.findOne({ where: { name } });
      if (existingPlan) {
        return res.status(400).json({ message: 'Plan with this name already exists' });
      }

      const plan = await Plan.create({
        name,
        description,
        permissions,
      });

      res.status(201).json({ plan });
    } catch (error) {
      console.error('Create plan error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   PUT /api/plans/:id
 * @desc    Update plan
 * @access  Private (Super Admin only)
 */
router.put(
  '/:id',
  requireSuperAdmin,
  [
    body('name').optional().trim().notEmpty(),
    body('description').optional().trim().notEmpty(),
    body('permissions').optional().isArray(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const plan = await Plan.findByPk(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
      }

      const { name, description, permissions } = req.body;

      if (name) plan.name = name;
      if (description) plan.description = description;
      if (permissions) plan.permissions = permissions;

      await plan.save();
      res.json({ plan });
    } catch (error) {
      console.error('Update plan error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   DELETE /api/plans/:id
 * @desc    Delete plan
 * @access  Private (Super Admin only)
 */
router.delete('/:id', requireSuperAdmin, async (req, res) => {
  try {
    const plan = await Plan.findByPk(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    // Check if plan is assigned to any hotel
    const hotelsUsingPlan = await Hotel.findAll({ where: { planId: plan.id } });
    
    if (hotelsUsingPlan.length > 0) {
      return res.status(400).json({
        message: `Cannot delete plan. It is assigned to ${hotelsUsingPlan.length} hotel(s)`,
      });
    }

    await plan.destroy();
    res.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
