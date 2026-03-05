const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User, Role } = require('../models');
const { authenticate } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public (or Protected based on your needs)
 */
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty(),
    body('role').isIn(['super_admin', 'hotel_admin', 'staff', 'guest']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name, role, hotelId, roleId } = req.body;

      // Check if user already exists
      let user = await User.findOne({ where: { email: email.toLowerCase() } });
      if (user) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      user = await User.create({
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        role,
        hotelId: hotelId || null,
        roleId: roleId || null,
      });

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        console.error('JWT_SECRET is not defined in environment variables');
        return res.status(500).json({ message: 'Server configuration error' });
      }

      const token = jwt.sign(
        { userId: user.id },
        jwtSecret,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          hotelId: user.hotelId,
          roleId: user.roleId,
        },
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user (accepts email or username)
 * @access  Public
 */
router.post(
  '/login',
  [
    body('email').notEmpty().withMessage('Email or username is required'),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Check if user exists by email or name (username)
      const loginValue = email.trim();
      const loginValueLower = loginValue.toLowerCase();
      
      let user = await User.findOne({
        where: {
          [Op.or]: [
            { email: loginValueLower },
            { email: loginValue },
            { name: loginValue },
            { name: loginValueLower }
          ]
        }
      });
      
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(400).json({ message: 'Account is inactive' });
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Get user permissions
      let permissions = user.permissions || [];
      
      // If user has a role, get permissions from role
      if (user.roleId) {
        const role = await Role.findByPk(user.roleId);
        if (role) {
          permissions = role.permissions;
        }
      }

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        console.error('JWT_SECRET is not defined in environment variables');
        return res.status(500).json({ message: 'Server configuration error' });
      }

      const token = jwt.sign(
        { userId: user.id },
        jwtSecret,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          hotelId: user.hotelId,
          roleId: user.roleId,
          permissions,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: require('../models/Hotel'), as: 'hotel', attributes: ['id', 'name'] },
        { model: Role, as: 'roleData', attributes: ['id', 'name', 'permissions'] },
      ],
    });

    let permissions = user.permissions || [];
    
    if (user.roleData && user.roleData.permissions) {
      permissions = user.roleData.permissions;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        hotelId: user.hotelId,
        roleId: user.roleId,
        permissions,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
