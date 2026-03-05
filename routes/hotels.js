const express = require('express');
const { body, validationResult } = require('express-validator');
const { Hotel, User, Plan } = require('../models');
const { authenticate, requireSuperAdmin } = require('../middleware/auth');
const MultiTenantDB = require('../utils/multiTenantDB');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/hotels
 * @desc    Get all hotels
 * @access  Private (Super Admin sees all, Hotel Admin sees only their hotel)
 */
router.get('/', async (req, res) => {
  try {
    let hotels;
    
    if (req.user.role === 'super_admin') {
      hotels = await Hotel.findAll({
        include: [{ model: Plan, as: 'plan', attributes: ['id', 'name', 'permissions'] }],
      });
    } else if (req.user.hotelId) {
      hotels = await Hotel.findAll({
        where: { id: req.user.hotelId },
        include: [{ model: Plan, as: 'plan', attributes: ['id', 'name', 'permissions'] }],
      });
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ hotels });
  } catch (error) {
    console.error('Get hotels error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/hotels/:id
 * @desc    Get single hotel
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const hotel = await Hotel.findByPk(req.params.id, {
      include: [{ model: Plan, as: 'plan', attributes: ['id', 'name', 'permissions'] }],
    });

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    // Check access
    if (req.user.role !== 'super_admin' && req.user.hotelId?.toString() !== hotel.id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ hotel });
  } catch (error) {
    console.error('Get hotel error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/hotels
 * @desc    Create new hotel
 * @access  Private (Super Admin only)
 */
router.post(
  '/',
  requireSuperAdmin,
  [
    body('name').trim().notEmpty(),
    body('address').trim().notEmpty(),
    body('phone').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('hotelAdminEmail').isEmail().normalizeEmail(),
    body('hotelAdminName').trim().notEmpty(),
    body('hotelAdminPassword').isLength({ min: 6 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, address, phone, email, planId, hotelAdminEmail, hotelAdminName, hotelAdminPassword } = req.body;

      // Check if hotel already exists
      const existingHotel = await Hotel.findOne({ where: { name } });
      if (existingHotel) {
        return res.status(400).json({ message: 'Hotel with this name already exists' });
      }

      // Check if hotel admin email already exists
      const existingUser = await User.findOne({ where: { email: hotelAdminEmail.toLowerCase() } });
      if (existingUser) {
        return res.status(400).json({ message: 'Hotel admin email already exists' });
      }

      // Create hotel
      const hotel = await Hotel.create({
        name,
        address,
        phone,
        email: email.toLowerCase(),
        planId: planId || null,
      });

      // Create hotel-specific schema
      await MultiTenantDB.createHotelDatabase(name);

      // Create hotel admin user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(hotelAdminPassword, salt);

      const hotelAdmin = await User.create({
        email: hotelAdminEmail.toLowerCase(),
        name: hotelAdminName,
        password: hashedPassword,
        role: 'hotel_admin',
        hotelId: hotel.id,
        isActive: true,
      });

      res.status(201).json({ 
        hotel,
        hotelAdmin: {
          id: hotelAdmin.id,
          email: hotelAdmin.email,
          name: hotelAdmin.name,
          role: hotelAdmin.role,
        }
      });
    } catch (error) {
      console.error('Create hotel error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   PUT /api/hotels/:id
 * @desc    Update hotel
 * @access  Private (Super Admin only)
 */
router.put(
  '/:id',
  requireSuperAdmin,
  [
    body('name').optional().trim().notEmpty(),
    body('address').optional().trim().notEmpty(),
    body('phone').optional().trim().notEmpty(),
    body('email').optional().isEmail().normalizeEmail(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const hotel = await Hotel.findByPk(req.params.id);
      if (!hotel) {
        return res.status(404).json({ message: 'Hotel not found' });
      }

      const { name, address, phone, email, planId } = req.body;

      // If name changed, create new schema (Note: In production, you might want to migrate data)
      if (name && name !== hotel.name) {
        await MultiTenantDB.createHotelDatabase(name);
      }

      // Update hotel
      if (name) hotel.name = name;
      if (address) hotel.address = address;
      if (phone) hotel.phone = phone;
      if (email) hotel.email = email.toLowerCase();
      if (planId !== undefined) hotel.planId = planId;

      await hotel.save();

      res.json({ hotel });
    } catch (error) {
      console.error('Update hotel error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   DELETE /api/hotels/:id
 * @desc    Delete hotel
 * @access  Private (Super Admin only)
 */
router.delete('/:id', requireSuperAdmin, async (req, res) => {
  try {
    const hotel = await Hotel.findByPk(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    // Delete hotel-specific schema
    await MultiTenantDB.deleteHotelDatabase(hotel.name);

    // Delete hotel
    await hotel.destroy();

    res.json({ message: 'Hotel deleted successfully' });
  } catch (error) {
    console.error('Delete hotel error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
