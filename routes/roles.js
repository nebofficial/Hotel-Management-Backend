const express = require('express');
const { body, validationResult } = require('express-validator');
const { Role, Hotel, User, Plan } = require('../models');
const { authenticate, hasPermission } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/roles
 * @desc    Get all roles
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    let roles;
    
    if (req.user.role === 'super_admin') {
      roles = await Role.findAll({
        include: [{ model: Hotel, as: 'hotel', attributes: ['id', 'name'] }],
      });
    } else if (req.user.hotelId) {
      roles = await Role.findAll({
        where: { hotelId: req.user.hotelId },
      });
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ roles });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/roles/:id
 * @desc    Get single role
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id, {
      include: [{ model: Hotel, as: 'hotel', attributes: ['id', 'name'] }],
    });

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Check access
    if (req.user.role !== 'super_admin' && req.user.hotelId?.toString() !== role.hotelId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ role });
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/roles
 * @desc    Create new role
 * @access  Private (requires Staff Management permission or super_admin)
 */
router.post(
  '/',
  [
    body('name').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('permissions').isArray(),
  ],
  async (req, res) => {
    try {
      // Check permissions: super_admin or hotel admin with Staff Management from plan
      if (req.user.role !== 'super_admin') {
        if (!req.user.hotelId) {
          return res.status(403).json({ message: 'Access denied. Hotel ID required.' });
        }
        
        // Check if hotel admin has Staff Management permission from their hotel's plan
        const hotel = await Hotel.findByPk(req.user.hotelId, {
          include: [{ model: Plan, as: 'plan' }],
        });
        if (!hotel || !hotel.plan) {
          return res.status(403).json({ message: 'Access denied. Hotel does not have a plan assigned.' });
        }
        
        if (!hotel.plan.permissions || !hotel.plan.permissions.includes('Staff Management')) {
          return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
        }
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, permissions } = req.body;

      // Determine hotelId
      let hotelId = req.user.hotelId;
      if (req.user.role === 'super_admin' && req.body.hotelId) {
        hotelId = req.body.hotelId;
      }

      if (!hotelId) {
        return res.status(400).json({ message: 'Hotel ID is required' });
      }

      // Get hotel and its plan
      const hotel = await Hotel.findByPk(hotelId, {
        include: [{ model: Plan, as: 'plan' }],
      });
      if (!hotel) {
        return res.status(404).json({ message: 'Hotel not found' });
      }

      // Validate permissions against hotel's plan
      if (hotel.plan) {
        const invalidPermissions = permissions.filter(
          perm => !hotel.plan.permissions.includes(perm)
        );
        
        if (invalidPermissions.length > 0) {
          return res.status(400).json({
            message: `Invalid permissions: ${invalidPermissions.join(', ')}. These permissions are not in your hotel's plan.`,
          });
        }
      } else {
        return res.status(400).json({
          message: 'Hotel does not have a plan assigned. Please assign a plan first.',
        });
      }

      // Check if role name already exists for this hotel
      const existingRole = await Role.findOne({ where: { name, hotelId } });
      if (existingRole) {
        return res.status(400).json({ message: 'Role with this name already exists for this hotel' });
      }

      const role = await Role.create({
        name,
        description,
        permissions,
        hotelId,
      });

      res.status(201).json({ role });
    } catch (error) {
      console.error('Create role error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   PUT /api/roles/:id
 * @desc    Update role
 * @access  Private (requires Staff Management permission or super_admin)
 */
router.put(
  '/:id',
  [
    body('name').optional().trim().notEmpty(),
    body('description').optional().trim().notEmpty(),
    body('permissions').optional().isArray(),
  ],
  async (req, res) => {
    try {
      // Check permissions: super_admin or hotel admin with Staff Management from plan
      if (req.user.role !== 'super_admin') {
        if (!req.user.hotelId) {
          return res.status(403).json({ message: 'Access denied. Hotel ID required.' });
        }
        
        // Check if hotel admin has Staff Management permission from their hotel's plan
        const hotel = await Hotel.findByPk(req.user.hotelId, {
          include: [{ model: Plan, as: 'plan' }],
        });
        if (!hotel || !hotel.plan) {
          return res.status(403).json({ message: 'Access denied. Hotel does not have a plan assigned.' });
        }
        
        if (!hotel.plan.permissions || !hotel.plan.permissions.includes('Staff Management')) {
          return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
        }
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const role = await Role.findByPk(req.params.id, {
        include: [{ model: Hotel, as: 'hotel' }],
      });
      if (!role) {
        return res.status(404).json({ message: 'Role not found' });
      }

      // Check access
      if (req.user.role !== 'super_admin' && req.user.hotelId?.toString() !== role.hotelId.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { name, description, permissions } = req.body;

      // Validate permissions against hotel's plan
      if (permissions) {
        const hotel = await Hotel.findByPk(role.hotelId, {
          include: [{ model: Plan, as: 'plan' }],
        });
        if (hotel && hotel.plan) {
          const invalidPermissions = permissions.filter(
            perm => !hotel.plan.permissions.includes(perm)
          );
          
          if (invalidPermissions.length > 0) {
            return res.status(400).json({
              message: `Invalid permissions: ${invalidPermissions.join(', ')}. These permissions are not in your hotel's plan.`,
            });
          }
        }
      }

      if (name) role.name = name;
      if (description) role.description = description;
      if (permissions) role.permissions = permissions;

      await role.save();
      res.json({ role });
    } catch (error) {
      console.error('Update role error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   DELETE /api/roles/:id
 * @desc    Delete role
 * @access  Private (requires Staff Management permission or super_admin)
 */
router.delete('/:id', async (req, res) => {
  try {
    // Check permissions: super_admin or hotel admin with Staff Management from plan
    if (req.user.role !== 'super_admin') {
      if (!req.user.hotelId) {
        return res.status(403).json({ message: 'Access denied. Hotel ID required.' });
      }
      
      // Check if hotel admin has Staff Management permission from their hotel's plan
      const hotel = await Hotel.findByPk(req.user.hotelId, {
        include: [{ model: Plan, as: 'plan' }],
      });
      if (!hotel || !hotel.plan) {
        return res.status(403).json({ message: 'Access denied. Hotel does not have a plan assigned.' });
      }
      
      if (!hotel.plan.permissions || !hotel.plan.permissions.includes('Staff Management')) {
        return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
      }
    }
    const role = await Role.findByPk(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Check access
    if (req.user.role !== 'super_admin' && req.user.hotelId?.toString() !== role.hotelId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if role is assigned to any users
    const usersWithRole = await User.findAll({ where: { roleId: role.id } });
    
    if (usersWithRole.length > 0) {
      return res.status(400).json({
        message: `Cannot delete role. It is assigned to ${usersWithRole.length} user(s)`,
      });
    }

    await role.destroy();
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
