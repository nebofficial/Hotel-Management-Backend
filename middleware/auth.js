const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

/**
 * Authentication middleware
 */
const authenticate = async (req, res, next) => {
  try {
    // Check if JWT_SECRET is configured
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, jwtSecret);

    // Get user from database
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] },
      include: [
        { model: require('../models/Hotel'), as: 'hotel', attributes: ['id', 'name'] },
        { model: Role, as: 'roleData', attributes: ['id', 'name', 'permissions'] },
      ],
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

/**
 * Check if user has specific permission
 */
const hasPermission = (permission) => {
  return async (req, res, next) => {
    try {
      // Super admin has all permissions
      if (req.user.role === 'super_admin') {
        return next();
      }

      // Check if user has the required permission
      if (req.user.permissions && req.user.permissions.includes(permission)) {
        return next();
      }

      // Check user's role permissions
      if (req.user.roleId) {
        const role = await Role.findByPk(req.user.roleId);
        if (role && role.permissions.includes(permission)) {
          return next();
        }
      }

      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    } catch (error) {
      res.status(500).json({ message: 'Error checking permissions', error: error.message });
    }
  };
};

/**
 * Check if user is super admin
 */
const requireSuperAdmin = async (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Access denied. Super admin only.' });
  }
  next();
};

/**
 * Check if user belongs to hotel or is super admin
 */
const requireHotelAccess = async (req, res, next) => {
  try {
    // Super admin can access any hotel
    if (req.user.role === 'super_admin') {
      return next();
    }

    // Check if user belongs to the hotel
    const hotelId = req.params.hotelId || req.body.hotelId || req.query.hotelId;
    
    if (!hotelId) {
      return res.status(400).json({ message: 'Hotel ID is required' });
    }

    if (req.user.hotelId && req.user.hotelId.toString() !== hotelId.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only access your own hotel data.' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking hotel access', error: error.message });
  }
};

module.exports = {
  authenticate,
  hasPermission,
  requireSuperAdmin,
  requireHotelAccess,
};
