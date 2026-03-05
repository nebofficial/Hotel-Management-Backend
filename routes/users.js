const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { User, Hotel, Role } = require('../models');
const { authenticate, requireSuperAdmin, hasPermission } = require('../middleware/auth');
const { generatePassword } = require('../utils/passwordGenerator');
const { sendCredentialsEmail } = require('../utils/emailService');
const { Op } = require('sequelize');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    let users;
    
    if (req.user.role === 'super_admin') {
      users = await User.findAll({
        attributes: { exclude: ['password'] },
        include: [
          { model: Hotel, as: 'hotel', attributes: ['id', 'name'] },
          { model: Role, as: 'roleData', attributes: ['id', 'name'] },
        ],
      });
    } else if (req.user.hotelId) {
      users = await User.findAll({
        where: { hotelId: req.user.hotelId },
        attributes: { exclude: ['password'] },
        include: [
          { model: Role, as: 'roleData', attributes: ['id', 'name'] },
        ],
      });
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Get single user
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
        include: [
          { model: Hotel, as: 'hotel', attributes: ['id', 'name'] },
          { model: Role, as: 'roleData', attributes: ['id', 'name', 'permissions'] },
        ],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check access
    if (req.user.role !== 'super_admin' && req.user.hotelId?.toString() !== user.hotelId?.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/users
 * @desc    Create new user (password is auto-generated and sent via email)
 * @access  Private (requires Staff Management permission or super_admin)
 */
router.post(
  '/',
  [
    body('email').isEmail().normalizeEmail(),
    body('name').trim().notEmpty(),
    body('role').isIn(['hotel_admin', 'staff', 'guest']),
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
          include: [{ model: require('../models/Plan'), as: 'plan' }],
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

      const { email, name, role, hotelId, roleId, permissions } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Determine hotelId
      let finalHotelId = hotelId;
      if (req.user.role !== 'super_admin') {
        finalHotelId = req.user.hotelId;
      }

      if (!finalHotelId) {
        return res.status(400).json({ message: 'Hotel ID is required' });
      }

      // Get hotel to get hotel name for password generation
      const hotel = await Hotel.findByPk(finalHotelId);
      if (!hotel) {
        return res.status(404).json({ message: 'Hotel not found' });
      }

      // Generate password: hotelname@randomdigitandchar
      const generatedPassword = generatePassword(hotel.name);

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(generatedPassword, salt);

      const user = await User.create({
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        role,
        hotelId: finalHotelId,
        roleId: roleId || null,
        permissions: permissions || [],
      });

      // Send email with credentials
      try {
        await sendCredentialsEmail(email, name, email, generatedPassword, hotel.name);
        console.log(`Credentials email sent to ${email}`);
      } catch (emailError) {
        console.error('Failed to send credentials email:', emailError);
        // Don't fail the user creation if email fails, but log it
        // User is already created, so we continue
      }

      const userResponse = await User.findByPk(user.id, {
        attributes: { exclude: ['password'] },
        include: [
          { model: Hotel, as: 'hotel', attributes: ['id', 'name'] },
          { model: Role, as: 'roleData', attributes: ['id', 'name'] },
        ],
      });

      res.status(201).json({ 
        user: userResponse,
        message: 'User created successfully. Credentials have been sent to the user\'s email.'
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (requires Staff Management permission or super_admin)
 */
router.put(
  '/:id',
  [
    body('email').optional().isEmail().normalizeEmail(),
    body('password').optional().isLength({ min: 6 }),
    body('name').optional().trim().notEmpty(),
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
          include: [{ model: require('../models/Plan'), as: 'plan' }],
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

      const user = await User.findByPk(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check access
      if (req.user.role !== 'super_admin' && req.user.hotelId?.toString() !== user.hotelId?.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { email, name, role, hotelId, roleId, permissions, isActive, password } = req.body;

      if (email) user.email = email.toLowerCase();
      if (name) user.name = name;
      if (role) user.role = role;
      if (hotelId !== undefined && req.user.role === 'super_admin') user.hotelId = hotelId;
      if (roleId !== undefined) user.roleId = roleId;
      if (permissions !== undefined) user.permissions = permissions;
      if (isActive !== undefined) user.isActive = isActive;
      
      if (password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
      }

      await user.save();

      const userResponse = await User.findByPk(user.id, {
        attributes: { exclude: ['password'] },
        include: [
          { model: Hotel, as: 'hotel', attributes: ['id', 'name'] },
          { model: Role, as: 'roleData', attributes: ['id', 'name'] },
        ],
      });

      res.json({ user: userResponse });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
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
        include: [{ model: require('../models/Plan'), as: 'plan' }],
      });
      if (!hotel || !hotel.plan) {
        return res.status(403).json({ message: 'Access denied. Hotel does not have a plan assigned.' });
      }
      
      if (!hotel.plan.permissions || !hotel.plan.permissions.includes('Staff Management')) {
        return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
      }
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check access
    if (req.user.role !== 'super_admin' && req.user.hotelId?.toString() !== user.hotelId?.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
