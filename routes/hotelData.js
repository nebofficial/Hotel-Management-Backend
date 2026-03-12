const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Hotel, HotelProfile, CheckinCheckoutRules, CurrencyLanguageSettings, RoomTypeDefinition, HotelAmenity } = require('../models');
const { DEFAULT_ROOM_TYPES } = require('../config/defaultRoomTypes');
const getHotelModels = require('../utils/hotelModels');
const { authenticate, requireHotelAccess } = require('../middleware/auth');
const { Op } = require('sequelize');
const createRoomBillRoutes = require('./roomBillRoutes');
const createAdvancePaymentRoutes = require('./advancePaymentRoutes');
const createCombinedBillRoutes = require('./combinedBillRoutes');
const createReservationDashboardRoutes = require('./reservationDashboardRoutes');
const createHrDashboardRoutes = require('./hrDashboardRoutes');
const createAttendanceRoutes = require('./attendanceRoutes');
const createRolesPermissionsRoutes = require('./rolesPermissionsRoutes');
const createShiftManagementRoutes = require('./shiftManagementRoutes');
const createPayrollRoutes = require('./payrollRoutes');
const createReservationRoutes = require('./reservationRoutes');
const createGroupBookingRoutes = require('./groupBookingRoutes');
const createWalkinRoutes = require('./walkinRoutes');
const createAvailabilityRoutes = require('./availabilityRoutes');
const createCheckinRoutes = require('./checkinRoutes');
const createCheckoutRoutes = require('./checkoutRoutes');
const createStayAdjustmentRoutes = require('./stayAdjustmentRoutes');
const createCancellationRoutes = require('./cancellationRoutes');
const createRefundRoutes = require('./refundRoutes');
const createCreditNoteRoutes = require('./creditNoteRoutes');
const createCommissionRoutes = require('./commissionRoutes');
const createReportsDashboardRoutes = require('./reportsDashboardRoutes');
const createOverviewRoutes = require('./overviewRoutes');
const createTodayActivityRoutes = require('./todayActivityRoutes');
const createNotificationRoutes = require('./notificationRoutes');
const createOccupancyReportRoutes = require('./occupancyReportRoutes');
const createRoomRevenueRoutes = require('./roomRevenueRoutes');
const createRestaurantSalesRoutes = require('./restaurantSalesRoutes');
const createTaxReportRoutes = require('./taxReportRoutes');
const createTaxesChargesRoutes = require('./taxesChargesRoutes');
const createPaymentMethodsRoutes = require('./paymentMethodsRoutes');
const createExpenseReportRoutes = require('./expenseReportRoutes');
const createInventoryReportRoutes = require('./inventoryReportRoutes');
const createRevenueReportRoutes = require('./revenueReportRoutes');
const createStaffPerformanceRoutes = require('./staffPerformanceRoutes');
const createMarketingDashboardRoutes = require('./marketingDashboardRoutes');
const createRatePlanRoutes = require('./ratePlanRoutes');
const createSeasonalPricingRoutes = require('./seasonalPricingRoutes');
const createCampaignRoutes = require('./campaignRoutes');
const createPromoCodeRoutes = require('./promoCodeRoutes');
const createInvoiceTemplatesRoutes = require('./invoiceTemplatesRoutes');
const createPOSSettingsRoutes = require('./posSettingsRoutes');
const createIntegrationSettingsRoutes = require('./integrationSettingsRoutes');
const createThemeSettingsRoutes = require('./themeSettingsRoutes');
const createAuditLogsRoutes = require('./auditLogsRoutes');
const createRestaurantBillRoutes = require('./restaurantBillRoutes');
const createCorporateBillingRoutes = require('./corporateBillingRoutes');

const router = express.Router();

// Configure multer storage for logo uploads
const uploadDir = path.join(__dirname, '..', 'uploads', 'logos');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeHotelId = (req.params.hotelId || 'unknown').toString();
    const fileName = `hotel-${safeHotelId}-${Date.now()}${ext}`;
    cb(null, fileName);
  },
});

const logoUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

// All routes require authentication
router.use(authenticate);

/**
 * Middleware to get hotel name and models
 */
const getHotelContext = async (req, res, next) => {
  try {
    const hotelId = req.params.hotelId || req.body.hotelId || req.query.hotelId || req.user?.hotelId;
    
    if (!hotelId) {
      return res.status(400).json({ message: 'Hotel ID is required' });
    }

    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const hotel = await Hotel.findByPk(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    if (!hotel.name) {
      return res.status(400).json({ message: 'Hotel name is missing' });
    }

    // Check access
    if (req.user.role !== 'super_admin' && req.user.hotelId?.toString() !== hotel.id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    req.hotel = hotel;
    try {
    req.hotelModels = getHotelModels(hotel.name);
    } catch (modelError) {
      console.error('Error creating hotel models:', modelError);
      return res.status(500).json({ 
        message: 'Error initializing hotel models', 
        error: modelError.message 
      });
    }
    next();
  } catch (error) {
    console.error('getHotelContext error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Error getting hotel context', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ==================== ROOM BILLS (MODULE ROUTER) ====================
// Mounted early so it can reuse getHotelContext + auth from this file.
router.use('/:hotelId/room-bills', createRoomBillRoutes(getHotelContext));

// ==================== ADVANCE PAYMENTS (MODULE ROUTER) ====================
router.use('/:hotelId/advance-payments', createAdvancePaymentRoutes(getHotelContext));

// ==================== COMBINED BILLS (MODULE ROUTER) ====================
router.use('/:hotelId/combined-bills', createCombinedBillRoutes(getHotelContext));

// ==================== RESERVATION DASHBOARD (MODULE ROUTER) ====================
router.use('/:hotelId/reservation-dashboard', createReservationDashboardRoutes(getHotelContext));

// ==================== HR DASHBOARD (MODULE ROUTER) ====================
router.use('/:hotelId/hr-dashboard', createHrDashboardRoutes(getHotelContext));

// ==================== ATTENDANCE (MODULE ROUTER) ====================
router.use('/:hotelId/attendance', createAttendanceRoutes(getHotelContext));

// ==================== ROLES & PERMISSIONS (MODULE ROUTER) ====================
router.use('/:hotelId/roles-permissions', createRolesPermissionsRoutes(getHotelContext));

// ==================== SHIFT MANAGEMENT (MODULE ROUTER) ====================
router.use('/:hotelId/shift-management', createShiftManagementRoutes(getHotelContext));

// ==================== PAYROLL (MODULE ROUTER) ====================
router.use('/:hotelId/payroll', createPayrollRoutes(getHotelContext));

// ==================== COMMISSION (MODULE ROUTER) ====================
router.use('/:hotelId/commission', createCommissionRoutes(getHotelContext));

// ==================== DASHBOARD & REPORTS (MODULE ROUTER) ====================
router.use('/:hotelId/overview-kpis', createOverviewRoutes(getHotelContext));
router.use('/:hotelId/today-activity', createTodayActivityRoutes(getHotelContext));
router.use('/:hotelId/notifications', createNotificationRoutes(getHotelContext));
router.use('/:hotelId/reports-dashboard', createReportsDashboardRoutes(getHotelContext));
router.use('/:hotelId/occupancy-report', createOccupancyReportRoutes(getHotelContext));
router.use('/:hotelId/room-revenue', createRoomRevenueRoutes(getHotelContext));
router.use('/:hotelId/restaurant-sales', createRestaurantSalesRoutes(getHotelContext));
router.use('/:hotelId/tax-report', createTaxReportRoutes(getHotelContext));
router.use('/:hotelId/taxes-charges', createTaxesChargesRoutes(getHotelContext));
router.use('/:hotelId/payment-methods', createPaymentMethodsRoutes(getHotelContext));
router.use('/:hotelId/invoice-templates', createInvoiceTemplatesRoutes(getHotelContext));
router.use('/:hotelId/pos-settings', createPOSSettingsRoutes(getHotelContext));
router.use('/:hotelId/integration-settings', createIntegrationSettingsRoutes(getHotelContext));
router.use('/:hotelId/theme-settings', createThemeSettingsRoutes(getHotelContext));
router.use('/:hotelId/expense-report', createExpenseReportRoutes(getHotelContext));
router.use('/:hotelId/inventory-report', createInventoryReportRoutes(getHotelContext));
router.use('/:hotelId/revenue-report', createRevenueReportRoutes(getHotelContext));
router.use('/:hotelId/staff-performance', createStaffPerformanceRoutes(getHotelContext));
router.use('/:hotelId/marketing-dashboard', createMarketingDashboardRoutes(getHotelContext));
router.use('/:hotelId/audit-logs', createAuditLogsRoutes(getHotelContext));
router.use('/:hotelId/rate-plans', createRatePlanRoutes(getHotelContext));
router.use('/:hotelId/seasonal-pricing', createSeasonalPricingRoutes(getHotelContext));
router.use('/:hotelId/campaigns', createCampaignRoutes(getHotelContext));
router.use('/:hotelId/promo-codes', createPromoCodeRoutes(getHotelContext));

// ==================== RESERVATIONS (MODULE ROUTER) ====================
router.use('/:hotelId/reservations', createReservationRoutes(getHotelContext));

// ==================== AVAILABILITY CALENDAR (MODULE ROUTER) ====================
router.use('/:hotelId/availability-calendar', createAvailabilityRoutes(getHotelContext));

// ==================== CHECK-IN (MODULE ROUTER) ====================
router.use('/:hotelId/checkin', createCheckinRoutes(getHotelContext));

// ==================== CHECK-OUT (MODULE ROUTER) ====================
router.use('/:hotelId/checkout', createCheckoutRoutes(getHotelContext));

// ==================== STAY ADJUSTMENTS (EARLY/LATE) ====================
router.use('/:hotelId/stay-adjustments', createStayAdjustmentRoutes(getHotelContext));

// ==================== GROUP BOOKINGS (MODULE ROUTER) ====================
router.use('/:hotelId/group-bookings', createGroupBookingRoutes(getHotelContext));

// ==================== WALK-IN BOOKINGS (MODULE ROUTER) ====================
router.use('/:hotelId/walkins', createWalkinRoutes(getHotelContext));

// ==================== CANCELLATIONS (MODULE ROUTER) ====================
router.use('/:hotelId/cancellations', createCancellationRoutes(getHotelContext));

// ==================== RESTAURANT BILLS (MODULE ROUTER) ====================
router.use('/:hotelId/restaurant-bills', createRestaurantBillRoutes(getHotelContext));

// ==================== REFUNDS (MODULE ROUTER) ====================
router.use('/:hotelId/refunds', createRefundRoutes(getHotelContext));

// ==================== CREDIT NOTES (MODULE ROUTER) ====================
router.use('/:hotelId/credit-notes', createCreditNoteRoutes(getHotelContext));

// ==================== CORPORATE BILLING (MODULE ROUTER) ====================
router.use('/:hotelId/corporate-billing', createCorporateBillingRoutes(getHotelContext));

// ==================== PROFILE ====================

/**
 * @route   GET /api/hotel-data/:hotelId/profile
 * @desc    Get basic profile + branding information for a hotel
 * @access  Private (hotel can only access its own data, or super admin)
 */
router.get('/:hotelId/profile', getHotelContext, async (req, res) => {
  try {
    const hotel = req.hotel;

    let profileRow;
    try {
      profileRow = await HotelProfile.findOne({
        where: { hotelId: hotel.id },
      });
    } catch (findErr) {
      console.error('HotelProfile.findOne error:', findErr.message);
      const profile = {
        name: hotel.name || '',
        location: hotel.address || '',
        phone: hotel.phone || '',
        email: hotel.email || '',
        website: '',
        plan: hotel.planId || '',
        currency: 'USD',
        language: 'English',
        timezone: 'UTC+0',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: 'HH:mm',
        currencySymbol: '₹',
        logoUrl: 'https://via.placeholder.com/150',
        description: '',
        openingTime: '',
        closingTime: '',
        specialHolidayHours: '',
        facebookUrl: '',
        instagramUrl: '',
        twitterUrl: '',
        linkedinUrl: '',
      };
      return res.json({ profile });
    }

    if (!profileRow) {
      try {
        profileRow = await HotelProfile.create({
          hotelId: hotel.id,
          website: '',
          currency: 'USD',
          currencySymbol: '₹',
          language: 'English',
          timezone: 'UTC+0',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: 'HH:mm',
        });
      } catch (createErr) {
        console.error('HotelProfile.create error (table may need new columns):', createErr.message);
        const profile = {
          name: hotel.name || '',
          location: hotel.address || '',
          phone: hotel.phone || '',
          email: hotel.email || '',
          website: '',
          plan: hotel.planId || '',
          currency: 'USD',
          language: 'English',
          timezone: 'UTC+0',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: 'HH:mm',
          currencySymbol: '₹',
          logoUrl: 'https://via.placeholder.com/150',
          description: '',
          openingTime: '',
          closingTime: '',
          specialHolidayHours: '',
          facebookUrl: '',
          instagramUrl: '',
          twitterUrl: '',
          linkedinUrl: '',
        };
        return res.json({ profile });
      }
    }

    const row = profileRow.get ? profileRow.get({ plain: true }) : profileRow;
    const profile = {
      name: hotel.name || '',
      location: hotel.address || '',
      phone: hotel.phone || '',
      email: hotel.email || '',
      website: (row && row.website) || '',
      plan: (row && row.planDisplayName) || hotel.planId || '',
      currency: (row && row.currency) || 'USD',
      language: (row && row.language) || 'English',
      timezone: (row && row.timezone) || 'UTC+0',
      dateFormat: (row && row.dateFormat) || 'MM/DD/YYYY',
      timeFormat: (row && row.timeFormat) || 'HH:mm',
      currencySymbol: (row && row.currencySymbol) || '₹',
      logoUrl: (row && row.logoUrl) || 'https://via.placeholder.com/150',
      description: (row && row.description) || '',
      openingTime: (row && row.openingTime) || '',
      closingTime: (row && row.closingTime) || '',
      specialHolidayHours: (row && row.specialHolidayHours) || '',
      facebookUrl: (row && row.facebookUrl) || '',
      instagramUrl: (row && row.instagramUrl) || '',
      twitterUrl: (row && row.twitterUrl) || '',
      linkedinUrl: (row && row.linkedinUrl) || '',
    };

    res.json({ profile });
  } catch (error) {
    console.error('Get hotel profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   PUT /api/hotel-data/:hotelId/profile
 * @desc    Update basic profile + branding information for a hotel
 * @access  Private (hotel can only update its own data, or super admin)
 */
router.put(
  '/:hotelId/profile',
  getHotelContext,
  [
    body('name').optional().isString().notEmpty(),
    body('location').optional().isString().notEmpty(),
    body('phone').optional().isString().notEmpty(),
    body('email').optional().isEmail(),
    body('website').optional().isString(),
    body('currency').optional().isString(),
    body('currencySymbol').optional().isString(),
    body('language').optional().isString(),
    body('timezone').optional().isString(),
    body('dateFormat').optional().isString(),
    body('timeFormat').optional().isString(),
    body('plan').optional().isString(),
    body('logoUrl').optional().isString(),
    body('description').optional().isString(),
    body('openingTime').optional().isString(),
    body('closingTime').optional().isString(),
    body('specialHolidayHours').optional().isString(),
    body('facebookUrl').optional().isString(),
    body('instagramUrl').optional().isString(),
    body('twitterUrl').optional().isString(),
    body('linkedinUrl').optional().isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // getHotelContext already guarantees the authenticated user
      // can only access their own hotel (unless super_admin).
      const hotel = req.hotel;
      const {
        name,
        location,
        phone,
        email,
        website,
        currency,
        currencySymbol,
        language,
        timezone,
        dateFormat,
        timeFormat,
        plan,
        logoUrl,
        description,
        openingTime,
        closingTime,
        specialHolidayHours,
        facebookUrl,
        instagramUrl,
        twitterUrl,
        linkedinUrl,
      } = req.body;

      if (name !== undefined) hotel.name = name;
      if (location !== undefined) hotel.address = location;
      if (phone !== undefined) hotel.phone = phone;
      if (email !== undefined) hotel.email = email;

      await hotel.save();

      let profileRow = await HotelProfile.findOne({
        where: { hotelId: hotel.id },
      });

      if (!profileRow) {
        profileRow = await HotelProfile.create({ hotelId: hotel.id });
      }

      if (website !== undefined) profileRow.website = website;
      if (currency !== undefined) profileRow.currency = currency;
      if (currencySymbol !== undefined) profileRow.currencySymbol = currencySymbol;
      if (language !== undefined) profileRow.language = language;
      if (timezone !== undefined) profileRow.timezone = timezone;
      if (dateFormat !== undefined) profileRow.dateFormat = dateFormat;
      if (timeFormat !== undefined) profileRow.timeFormat = timeFormat;
      if (plan !== undefined) profileRow.planDisplayName = plan;
      if (logoUrl !== undefined) profileRow.logoUrl = logoUrl;
      if (description !== undefined) profileRow.description = description;
      if (openingTime !== undefined) profileRow.openingTime = openingTime;
      if (closingTime !== undefined) profileRow.closingTime = closingTime;
      if (specialHolidayHours !== undefined) profileRow.specialHolidayHours = specialHolidayHours;
      if (facebookUrl !== undefined) profileRow.facebookUrl = facebookUrl;
      if (instagramUrl !== undefined) profileRow.instagramUrl = instagramUrl;
      if (twitterUrl !== undefined) profileRow.twitterUrl = twitterUrl;
      if (linkedinUrl !== undefined) profileRow.linkedinUrl = linkedinUrl;

      await profileRow.save();

      const updatedProfile = {
        name: hotel.name,
        location: hotel.address,
        phone: hotel.phone,
        email: hotel.email,
        website: profileRow.website || '',
        plan: profileRow.planDisplayName || hotel.planId || '',
        currency: profileRow.currency || 'USD',
        language: profileRow.language || 'English',
        timezone: profileRow.timezone || 'UTC+0',
        dateFormat: profileRow.dateFormat || 'MM/DD/YYYY',
        timeFormat: profileRow.timeFormat || 'HH:mm',
        currencySymbol: profileRow.currencySymbol || '₹',
        logoUrl:
          profileRow.logoUrl || 'https://via.placeholder.com/150',
        description: profileRow.description || '',
        openingTime: profileRow.openingTime || '',
        closingTime: profileRow.closingTime || '',
        specialHolidayHours: profileRow.specialHolidayHours || '',
        facebookUrl: profileRow.facebookUrl || '',
        instagramUrl: profileRow.instagramUrl || '',
        twitterUrl: profileRow.twitterUrl || '',
        linkedinUrl: profileRow.linkedinUrl || '',
      };

      res.json({ profile: updatedProfile });
    } catch (error) {
      console.error('Update hotel profile error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   POST /api/hotel-data/:hotelId/profile/logo
 * @desc    Upload and update hotel logo
 * @access  Private (hotel can only update its own data, or super admin)
 */
router.post(
  '/:hotelId/profile/logo',
  authenticate,
  requireHotelAccess,
  logoUpload.single('logo'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Logo file is required' });
      }

      const hotelId = req.params.hotelId;
      const relativePath = path.join('uploads', 'logos', req.file.filename).replace(/\\/g, '/');

      const baseUrl =
        process.env.PUBLIC_BASE_URL ||
        `${req.protocol}://${req.get('host')}`;

      const logoUrl = `${baseUrl}/${relativePath}`;

      let profileRow = await HotelProfile.findOne({ where: { hotelId } });
      if (!profileRow) {
        profileRow = await HotelProfile.create({ hotelId });
      }

      profileRow.logoUrl = logoUrl;
      await profileRow.save();

      res.status(201).json({ logoUrl });
    } catch (error) {
      console.error('Upload logo error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// ==================== CHECK-IN / CHECK-OUT RULES ====================

const defaultRules = () => ({
  standardCheckInTime: '14:00',
  standardCheckOutTime: '11:00',
  allowEarlyCheckin: false,
  earliestCheckinTime: '',
  earlyCheckinFeeType: 'fixed',
  earlyCheckinFee: 0,
  allowLateCheckout: false,
  latestCheckoutTime: '',
  lateCheckoutFeeType: 'fixed',
  lateCheckoutFee: 0,
  hourlyExtensionRate: 0,
  gracePeriodMinutes: 0,
  chargeAfterGracePeriod: true,
  autoCheckoutAfterMinutes: 0,
  sendCheckoutReminder: false,
  policyNotes: '',
  specialInstructions: '',
});

router.get('/:hotelId/checkin-checkout-rules', getHotelContext, async (req, res) => {
  try {
    const hotel = req.hotel;
    let row = await CheckinCheckoutRules.findOne({ where: { hotelId: hotel.id } }).catch(() => null);
    if (!row) {
      row = await CheckinCheckoutRules.create({ hotelId: hotel.id, ...defaultRules() }).catch(() => null);
    }
    const rules = row ? row.get({ plain: true }) : defaultRules();
    delete rules.id;
    delete rules.hotelId;
    delete rules.createdAt;
    delete rules.updatedAt;
    res.json({ rules });
  } catch (error) {
    console.error('Get checkin-checkout rules error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put(
  '/:hotelId/checkin-checkout-rules',
  getHotelContext,
  [
    body('standardCheckInTime').optional().isString(),
    body('standardCheckOutTime').optional().isString(),
    body('allowEarlyCheckin').optional().isBoolean(),
    body('earliestCheckinTime').optional().isString(),
    body('earlyCheckinFeeType').optional().isString(),
    body('earlyCheckinFee').optional().isNumeric(),
    body('allowLateCheckout').optional().isBoolean(),
    body('latestCheckoutTime').optional().isString(),
    body('lateCheckoutFeeType').optional().isString(),
    body('lateCheckoutFee').optional().isNumeric(),
    body('hourlyExtensionRate').optional().isNumeric(),
    body('gracePeriodMinutes').optional().isInt({ min: 0 }),
    body('chargeAfterGracePeriod').optional().isBoolean(),
    body('autoCheckoutAfterMinutes').optional().isInt({ min: 0 }),
    body('sendCheckoutReminder').optional().isBoolean(),
    body('policyNotes').optional().isString(),
    body('specialInstructions').optional().isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const hotel = req.hotel;
      const allowed = [
        'standardCheckInTime', 'standardCheckOutTime', 'allowEarlyCheckin', 'earliestCheckinTime',
        'earlyCheckinFeeType', 'earlyCheckinFee', 'allowLateCheckout', 'latestCheckoutTime',
        'lateCheckoutFeeType', 'lateCheckoutFee', 'hourlyExtensionRate', 'gracePeriodMinutes',
        'chargeAfterGracePeriod', 'autoCheckoutAfterMinutes', 'sendCheckoutReminder',
        'policyNotes', 'specialInstructions',
      ];
      let row = await CheckinCheckoutRules.findOne({ where: { hotelId: hotel.id } });
      if (!row) row = await CheckinCheckoutRules.create({ hotelId: hotel.id, ...defaultRules() });
      for (const key of allowed) {
        if (req.body[key] !== undefined) row[key] = req.body[key];
      }
      await row.save();
      const rules = row.get({ plain: true });
      delete rules.id;
      delete rules.hotelId;
      delete rules.createdAt;
      delete rules.updatedAt;
      res.json({ rules });
    } catch (error) {
      console.error('Update checkin-checkout rules error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// ==================== CURRENCY & LANGUAGE ====================

function defaultCurrencyLanguage(profileRow) {
  return {
    currency: (profileRow && profileRow.currency) || 'USD',
    currencySymbol: (profileRow && profileRow.currencySymbol) || '₹',
    language: (profileRow && profileRow.language) || 'English',
    timezone: (profileRow && profileRow.timezone) || 'UTC+0',
    dateFormat: (profileRow && profileRow.dateFormat) || 'MM/DD/YYYY',
    timeFormat: (profileRow && profileRow.timeFormat) || 'HH:mm',
    decimalPrecision: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    currencyRounding: 'nearest',
    exchangeRates: [],
    enabledLanguages: ['en'],
    defaultLanguage: 'en',
    autoTimeSync: true,
  };
}

router.get('/:hotelId/currency-language', getHotelContext, async (req, res) => {
  try {
    const hotel = req.hotel;
    const profileRow = await HotelProfile.findOne({ where: { hotelId: hotel.id } }).catch(() => null);
    let settingsRow = await CurrencyLanguageSettings.findOne({ where: { hotelId: hotel.id } }).catch(() => null);
    if (!settingsRow) {
      try {
        settingsRow = await CurrencyLanguageSettings.create({ hotelId: hotel.id });
      } catch (e) {
        settingsRow = null;
      }
    }
    const p = profileRow && profileRow.get ? profileRow.get({ plain: true }) : {};
    const s = settingsRow && settingsRow.get ? settingsRow.get({ plain: true }) : {};
    let exchangeRates = [];
    try {
      exchangeRates = typeof s.exchangeRates === 'string' ? JSON.parse(s.exchangeRates || '[]') : (s.exchangeRates || []);
    } catch (_) {}
    let enabledLanguages = ['en'];
    try {
      enabledLanguages = typeof s.enabledLanguages === 'string' ? JSON.parse(s.enabledLanguages || '["en"]') : (s.enabledLanguages || ['en']);
    } catch (_) {}
    const settings = {
      currency: p.currency || 'USD',
      currencySymbol: p.currencySymbol || '₹',
      language: p.language || 'English',
      timezone: p.timezone || 'UTC+0',
      dateFormat: p.dateFormat || 'MM/DD/YYYY',
      timeFormat: p.timeFormat || 'HH:mm',
      decimalPrecision: s.decimalPrecision != null ? s.decimalPrecision : 2,
      thousandsSeparator: s.thousandsSeparator != null ? s.thousandsSeparator : ',',
      decimalSeparator: s.decimalSeparator != null ? s.decimalSeparator : '.',
      currencyRounding: s.currencyRounding || 'nearest',
      exchangeRates,
      enabledLanguages,
      defaultLanguage: s.defaultLanguage || 'en',
      autoTimeSync: s.autoTimeSync !== false,
    };
    res.json({ settings });
  } catch (error) {
    console.error('Get currency-language error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put(
  '/:hotelId/currency-language',
  getHotelContext,
  [
    body('currency').optional().isString(),
    body('currencySymbol').optional().isString(),
    body('language').optional().isString(),
    body('timezone').optional().isString(),
    body('dateFormat').optional().isString(),
    body('timeFormat').optional().isString(),
    body('decimalPrecision').optional().isInt({ min: 0, max: 6 }),
    body('thousandsSeparator').optional().isString(),
    body('decimalSeparator').optional().isString(),
    body('currencyRounding').optional().isString(),
    body('exchangeRates').optional(),
    body('enabledLanguages').optional(),
    body('defaultLanguage').optional().isString(),
    body('autoTimeSync').optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const hotel = req.hotel;
      const body = req.body;

      let profileRow = await HotelProfile.findOne({ where: { hotelId: hotel.id } });
      if (!profileRow) profileRow = await HotelProfile.create({ hotelId: hotel.id });
      if (body.currency !== undefined) profileRow.currency = body.currency;
      if (body.currencySymbol !== undefined) profileRow.currencySymbol = body.currencySymbol;
      if (body.language !== undefined) profileRow.language = body.language;
      if (body.timezone !== undefined) profileRow.timezone = body.timezone;
      if (body.dateFormat !== undefined) profileRow.dateFormat = body.dateFormat;
      if (body.timeFormat !== undefined) profileRow.timeFormat = body.timeFormat;
      await profileRow.save();

      let settingsRow = await CurrencyLanguageSettings.findOne({ where: { hotelId: hotel.id } });
      if (!settingsRow) settingsRow = await CurrencyLanguageSettings.create({ hotelId: hotel.id });
      if (body.decimalPrecision !== undefined) settingsRow.decimalPrecision = body.decimalPrecision;
      if (body.thousandsSeparator !== undefined) settingsRow.thousandsSeparator = body.thousandsSeparator;
      if (body.decimalSeparator !== undefined) settingsRow.decimalSeparator = body.decimalSeparator;
      if (body.currencyRounding !== undefined) settingsRow.currencyRounding = body.currencyRounding;
      if (body.exchangeRates !== undefined) settingsRow.exchangeRates = typeof body.exchangeRates === 'string' ? body.exchangeRates : JSON.stringify(Array.isArray(body.exchangeRates) ? body.exchangeRates : []);
      if (body.enabledLanguages !== undefined) settingsRow.enabledLanguages = typeof body.enabledLanguages === 'string' ? body.enabledLanguages : JSON.stringify(Array.isArray(body.enabledLanguages) ? body.enabledLanguages : ['en']);
      if (body.defaultLanguage !== undefined) settingsRow.defaultLanguage = body.defaultLanguage;
      if (body.autoTimeSync !== undefined) settingsRow.autoTimeSync = body.autoTimeSync;
      await settingsRow.save();

      const p = profileRow.get({ plain: true });
      const s = settingsRow.get({ plain: true });
      let exchangeRates = [];
      try {
        exchangeRates = typeof s.exchangeRates === 'string' ? JSON.parse(s.exchangeRates || '[]') : (s.exchangeRates || []);
      } catch (_) {}
      let enabledLanguages = ['en'];
      try {
        enabledLanguages = typeof s.enabledLanguages === 'string' ? JSON.parse(s.enabledLanguages || '["en"]') : (s.enabledLanguages || ['en']);
      } catch (_) {}
      res.json({
        settings: {
          currency: p.currency || 'USD',
          currencySymbol: p.currencySymbol || '₹',
          language: p.language || 'English',
          timezone: p.timezone || 'UTC+0',
          dateFormat: p.dateFormat || 'MM/DD/YYYY',
          timeFormat: p.timeFormat || 'HH:mm',
          decimalPrecision: s.decimalPrecision != null ? s.decimalPrecision : 2,
          thousandsSeparator: s.thousandsSeparator != null ? s.thousandsSeparator : ',',
          decimalSeparator: s.decimalSeparator != null ? s.decimalSeparator : '.',
          currencyRounding: s.currencyRounding || 'nearest',
          exchangeRates,
          enabledLanguages,
          defaultLanguage: s.defaultLanguage || 'en',
          autoTimeSync: s.autoTimeSync !== false,
        },
      });
    } catch (error) {
      console.error('Update currency-language error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// ==================== DASHBOARD OVERVIEW ====================

/**
 * @route   GET /api/hotel-data/:hotelId/dashboard
 * @desc    High-level dashboard metrics for a hotel
 * @access  Private
 */
router.get('/:hotelId/dashboard', getHotelContext, async (req, res) => {
  try {
    const { Booking, Payment, Room, Complaint } = req.hotelModels;

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    // New bookings created today
    const newBookingsToday = await Booking.count({
      where: {
        createdAt: {
          [Op.between]: [startOfToday, endOfToday],
        },
      },
    }).catch(() => 0);

    // Check-ins / Check-outs today (based on checkIn/checkOut date)
    const checkInsToday = await Booking.count({
      where: {
        checkIn: {
          [Op.between]: [startOfToday, endOfToday],
        },
      },
    }).catch(() => 0);

    const checkOutsToday = await Booking.count({
      where: {
        checkOut: {
          [Op.between]: [startOfToday, endOfToday],
        },
      },
    }).catch(() => 0);

    // Total revenue (all time)
    const payments = await Payment.findAll({
      attributes: ['amount', 'createdAt', 'paymentMethod'],
    }).catch(() => []);

    let totalRevenue = 0;
    const revenueByDayMap = new Map();
    const daysBack = 7;
    for (const p of payments) {
      const amt = Number(p.amount || 0);
      if (!Number.isFinite(amt)) continue;
      totalRevenue += amt;
      const created = p.createdAt ? new Date(p.createdAt) : null;
      if (!created) continue;
      const dayKey = created.toISOString().slice(0, 10);
      revenueByDayMap.set(dayKey, (revenueByDayMap.get(dayKey) || 0) + amt);
    }

    const revenueByDay = [];
    for (let i = daysBack - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      revenueByDay.push({
        date: key,
        value: Number(revenueByDayMap.get(key) || 0),
      });
    }

    // Room availability
    const rooms = await Room.findAll({
      attributes: ['status'],
    }).catch(() => []);

    const roomTotals = {
      total: rooms.length,
      occupied: 0,
      maintenance: 0,
      cleaning: 0,
      available: 0,
    };

    rooms.forEach((r) => {
      const s = String(r.status || 'available').toLowerCase();
      if (s === 'occupied') roomTotals.occupied += 1;
      else if (s === 'maintenance') roomTotals.maintenance += 1;
      else if (s === 'cleaning') roomTotals.cleaning += 1;
      else roomTotals.available += 1;
    });

    // Booking by platform (approximate using paymentMethod)
    const platformBuckets = {
      online: 0,
      pos: 0,
      other: 0,
    };
    payments.forEach((p) => {
      const method = String(p.paymentMethod || '').toLowerCase();
      if (method === 'credit_card' || method === 'debit_card') {
        platformBuckets.online += 1;
      } else if (method === 'cash') {
        platformBuckets.pos += 1;
      } else {
        platformBuckets.other += 1;
      }
    });

    // Open complaints (reuse complaints table)
    const openComplaints = await Complaint.count({
      where: { status: 'Open' },
    }).catch(() => 0);

    res.json({
      metrics: {
        newBookingsToday,
        checkInsToday,
        checkOutsToday,
        totalRevenue,
        openComplaints,
      },
      revenueByDay,
      roomAvailability: roomTotals,
      bookingByPlatform: [
        { name: 'Online', value: platformBuckets.online },
        { name: 'Front desk', value: platformBuckets.pos },
        { name: 'Other', value: platformBuckets.other },
      ],
    });
  } catch (error) {
    console.error('Get dashboard metrics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== PAYMENTS ====================

/**
 * @route   GET /api/hotel-data/:hotelId/payments
 * @desc    Get all payments for a hotel
 * @access  Private
 */
router.get('/:hotelId/payments', getHotelContext, async (req, res) => {
  try {
    const { Payment } = req.hotelModels;
    const where = {};
    if (req.query.paymentMethod) where.paymentMethod = req.query.paymentMethod;
    if (req.query.status) where.status = req.query.status;
    if (req.query.startDate || req.query.endDate) {
      where.createdAt = {};
      if (req.query.startDate) where.createdAt[Op.gte] = req.query.startDate;
      if (req.query.endDate) where.createdAt[Op.lte] = req.query.endDate;
    }
    const payments = await Payment.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
    res.json({ payments: payments.map((p) => p.toJSON()) });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/hotel-data/:hotelId/payments
 * @desc    Create new payment
 * @access  Private
 */
router.post(
  '/:hotelId/payments',
  getHotelContext,
  [
    body('bookingId').notEmpty(),
    body('amount').isNumeric(),
    body('paymentMethod').isIn(['credit_card', 'debit_card', 'cash', 'bank_transfer', 'other']),
    body('guestId').notEmpty(),
    body('guestName').notEmpty(),
    body('transactionId').custom((value, { req }) => {
      const method = req.body.paymentMethod;
      const needsRef = method && method !== 'cash';
      if (needsRef && !value) {
        throw new Error('transactionId is required for non-cash payments');
      }
      return true;
    }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { Payment } = req.hotelModels;
      const payment = await Payment.create(req.body);
      res.status(201).json({ payment });
    } catch (error) {
      console.error('Create payment error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// ==================== INVOICES ====================

async function generateNextInvoiceNumber(Invoice, yearInput) {
  const now = new Date();
  const year = yearInput || now.getFullYear().toString();
  const prefix = `INV-${year}-`;
  const last = await Invoice.findOne({
    where: { invoiceNumber: { [Op.like]: `${prefix}%` } },
    order: [['invoiceNumber', 'DESC']],
  });
  let nextSeq = 1;
  if (last && last.invoiceNumber.startsWith(prefix)) {
    const suffix = last.invoiceNumber.slice(prefix.length);
    const n = parseInt(suffix, 10);
    if (!Number.isNaN(n)) nextSeq = n + 1;
  }
  return `${prefix}${nextSeq.toString().padStart(4, '0')}`;
}

router.get('/:hotelId/invoices/next-number', getHotelContext, async (req, res) => {
  try {
    const { Invoice } = req.hotelModels;
    await Invoice.sync();
    const next = await generateNextInvoiceNumber(Invoice, req.query.year);
    res.json({ invoiceNumber: next });
  } catch (error) {
    console.error('Get next invoice number error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:hotelId/invoices', getHotelContext, async (req, res) => {
  try {
    const { Invoice } = req.hotelModels;
    await Invoice.sync();
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.startDate || req.query.endDate) {
      where.issueDate = {};
      if (req.query.startDate) where.issueDate[Op.gte] = req.query.startDate;
      if (req.query.endDate) where.issueDate[Op.lte] = req.query.endDate;
    }
    if (req.query.search) {
      const term = `%${req.query.search}%`;
      where[Op.or] = [
        { invoiceNumber: { [Op.iLike]: term } },
        { guestName: { [Op.iLike]: term } },
      ];
    }
    const invoices = await Invoice.findAll({
      where,
      order: [['issueDate', 'DESC'], ['createdAt', 'DESC']],
    });
    res.json({ invoices: invoices.map((i) => i.toJSON()) });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post(
  '/:hotelId/invoices',
  getHotelContext,
  [
    body('guestName').notEmpty(),
    body('issueDate').isISO8601(),
    body('items').isArray({ min: 1 }),
    body('subtotal').isNumeric(),
    body('taxAmount').isNumeric(),
    body('totalAmount').isNumeric(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { Invoice } = req.hotelModels;
      await Invoice.sync();
      // Always generate the next invoice number on the server to avoid duplicates
      const invoiceNumber = await generateNextInvoiceNumber(Invoice, req.body.year);

      const invoice = await Invoice.create({
        invoiceNumber,
        bookingId: req.body.bookingId || null,
        guestId: req.body.guestId || null,
        guestName: req.body.guestName,
        issueDate: req.body.issueDate,
        dueDate: req.body.dueDate || null,
        status: req.body.status || 'PENDING',
        currency: req.body.currency || 'USD',
        subtotal: Number(req.body.subtotal || 0),
        taxAmount: Number(req.body.taxAmount || 0),
        totalAmount: Number(req.body.totalAmount || 0),
        taxPercent: req.body.taxPercent != null ? Number(req.body.taxPercent) : null,
        notes: req.body.notes || null,
        items: req.body.items || [],
      });

      res.status(201).json({ invoice: invoice.toJSON() });
    } catch (error) {
      console.error('Create invoice error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// ==================== TAXES ====================

router.get('/:hotelId/taxes/settings', getHotelContext, async (req, res) => {
  try {
    const { TaxSetting } = req.hotelModels;
    await TaxSetting.sync();
    let setting = await TaxSetting.findOne();
    if (!setting) {
      setting = await TaxSetting.create({});
    }
    res.json({ settings: setting.toJSON() });
  } catch (error) {
    console.error('Get tax settings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== JOURNAL ENTRIES ====================

async function generateNextJournalNumber(JournalEntry, yearInput) {
  const now = new Date();
  const year = yearInput || now.getFullYear().toString();
  const prefix = `JV-${year}-`;
  const last = await JournalEntry.findOne({
    where: { voucherNumber: { [Op.like]: `${prefix}%` } },
    order: [['voucherNumber', 'DESC']],
  });
  let nextSeq = 1;
  if (last && last.voucherNumber.startsWith(prefix)) {
    const suffix = last.voucherNumber.slice(prefix.length);
    const n = parseInt(suffix, 10);
    if (!Number.isNaN(n)) nextSeq = n + 1;
  }
  return `${prefix}${nextSeq.toString().padStart(4, '0')}`;
}

router.get('/:hotelId/journal-entries/next-number', getHotelContext, async (req, res) => {
  try {
    const { JournalEntry } = req.hotelModels;
    await JournalEntry.sync();
    const next = await generateNextJournalNumber(JournalEntry, req.query.year);
    res.json({ voucherNumber: next });
  } catch (error) {
    console.error('Get next journal number error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:hotelId/journal-entries', getHotelContext, async (req, res) => {
  try {
    const { JournalEntry } = req.hotelModels;
    await JournalEntry.sync();
    const where = {};
    if (req.query.startDate || req.query.endDate) {
      where.date = {};
      if (req.query.startDate) where.date[Op.gte] = req.query.startDate;
      if (req.query.endDate) where.date[Op.lte] = req.query.endDate;
    }
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const entries = await JournalEntry.findAll({
      where,
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
      limit,
    });
    res.json({ entries: entries.map((e) => e.toJSON()) });
  } catch (error) {
    console.error('Get journal entries error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post(
  '/:hotelId/journal-entries',
  getHotelContext,
  [
    body('date').isISO8601(),
    body('lines').isArray({ min: 1 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { JournalEntry } = req.hotelModels;
      await JournalEntry.sync();

      const lines = (req.body.lines || []).map((l) => ({
        accountId: l.accountId || null,
        accountName: l.accountName || '',
        debit: Number(l.debit || 0),
        credit: Number(l.credit || 0),
      }));
      const totalDebit = lines.reduce((s, l) => s + Number(l.debit || 0), 0);
      const totalCredit = lines.reduce((s, l) => s + Number(l.credit || 0), 0);

      if (totalDebit <= 0 || totalCredit <= 0) {
        return res.status(400).json({ message: 'Debit and Credit totals must be greater than zero' });
      }
      if (Math.abs(totalDebit - totalCredit) > 0.001) {
        return res.status(400).json({ message: 'Journal entry is not balanced (debits ≠ credits)' });
      }

      const voucherNumber = await generateNextJournalNumber(JournalEntry, req.body.year);

      const entry = await JournalEntry.create({
        voucherNumber,
        date: req.body.date,
        narration: req.body.narration || null,
        lines,
        totalDebit,
        totalCredit,
        isBalanced: true,
        autoPosted: !!req.body.autoPosted,
      });

      res.status(201).json({ entry: entry.toJSON() });
    } catch (error) {
      console.error('Create journal entry error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);
router.put('/:hotelId/taxes/settings', getHotelContext, async (req, res) => {
  try {
    const { TaxSetting } = req.hotelModels;
    await TaxSetting.sync();
    let setting = await TaxSetting.findOne();
    if (!setting) {
      setting = await TaxSetting.create({});
    }
    const fields = [
      'gstEnabled',
      'defaultGstRate',
      'cgstPercent',
      'sgstPercent',
      'igstPercent',
      'serviceChargeRoom',
      'serviceChargeRestaurant',
    ];
    const updates = {};
    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        updates[f] =
          ['defaultGstRate', 'cgstPercent', 'sgstPercent', 'igstPercent', 'serviceChargeRoom', 'serviceChargeRestaurant'].includes(
            f
          ) && req.body[f] !== null
            ? Number(req.body[f])
            : req.body[f];
      }
    });
    await setting.update(updates);
    res.json({ settings: setting.toJSON() });
  } catch (error) {
    console.error('Update tax settings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:hotelId/taxes/summary', getHotelContext, async (req, res) => {
  try {
    const { Invoice, RestaurantBill, Expense } = req.hotelModels;
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
    const daysBack = 90;
    const rangeStart = startDate || (() => { const d = new Date(); d.setDate(d.getDate() - daysBack); return d; })();
    const rangeEnd = endDate || new Date();

    const invoiceWhere = { issueDate: { [Op.gte]: rangeStart, [Op.lte]: rangeEnd } };
    const billWhere = { status: 'Paid', createdAt: { [Op.gte]: rangeStart, [Op.lte]: rangeEnd } };
    const expenseWhere = {
      expenseDate: { [Op.gte]: rangeStart, [Op.lte]: rangeEnd },
    };

    const [invoices, bills, expenses] = await Promise.all([
      Invoice.findAll({ where: invoiceWhere }),
      RestaurantBill.findAll({ where: billWhere }),
      Expense.findAll({ where: expenseWhere }),
    ]);

    const totalOutputTax =
      invoices.reduce((s, inv) => s + Number(inv.taxAmount || 0), 0) +
      bills.reduce((s, b) => s + Number(b.taxAmount || (b.taxBreakdown && b.taxBreakdown.totalTax) || 0), 0);

    const totalInputTax = expenses
      .filter((e) => e.category && /gst/i.test(e.category))
      .reduce((s, e) => s + Number(e.amount || 0), 0);

    const byMonthMap = {};
    const add = (date, amount, key) => {
      const d = date ? new Date(date) : new Date();
      const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonthMap[m]) byMonthMap[m] = { month: m, outputTax: 0, inputTax: 0 };
      byMonthMap[m][key] += amount;
    };
    invoices.forEach((inv) => add(inv.issueDate, Number(inv.taxAmount || 0), 'outputTax'));
    bills.forEach((b) =>
      add(b.createdAt, Number(b.taxAmount || (b.taxBreakdown && b.taxBreakdown.totalTax) || 0), 'outputTax')
    );
    expenses
      .filter((e) => e.category && /gst/i.test(e.category))
      .forEach((e) => add(e.expenseDate || e.createdAt, Number(e.amount || 0), 'inputTax'));

    res.json({
      totalInputTax,
      totalOutputTax,
      netGstPayable: totalOutputTax - totalInputTax,
      byMonth: Object.values(byMonthMap),
    });
  } catch (error) {
    console.error('Tax summary error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== PROFIT & LOSS ====================

router.get('/:hotelId/profit-loss', getHotelContext, async (req, res) => {
  try {
    const { Payment, RestaurantBill, BarOrder, Expense } = req.hotelModels;
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
    const daysBack = 30;
    const rangeStart = startDate || (() => { const d = new Date(); d.setDate(d.getDate() - daysBack); return d; })();
    const rangeEnd = endDate || new Date();

    const dateFilter = { [Op.gte]: rangeStart, [Op.lte]: rangeEnd };

    const [payments, restaurantBills, barOrders, expenses] = await Promise.all([
      Payment.findAll({ where: { status: 'completed', createdAt: dateFilter } }),
      RestaurantBill.findAll({ where: { status: 'Paid', createdAt: dateFilter } }),
      BarOrder.findAll({ where: { status: 'Served', createdAt: dateFilter } }),
      Expense.findAll({ where: { expenseDate: { [Op.gte]: rangeStart, [Op.lte]: rangeEnd } } }),
    ]);

    let roomIncome = 0;
    payments.forEach((p) => {
      roomIncome += Number(p.amount || 0);
    });

    let restaurantIncome = 0;
    restaurantBills.forEach((b) => {
      restaurantIncome += Number(b.totalAmount || 0);
    });

    let barIncome = 0;
    barOrders.forEach((b) => {
      barIncome += Number(b.totalAmount || 0);
    });

    const totalIncome = roomIncome + restaurantIncome + barIncome;

    let totalExpenses = 0;
    const expenseByCategory = {};
    expenses.forEach((e) => {
      const amt = Number(e.amount || 0);
      totalExpenses += amt;
      const cat = e.category || 'Other';
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + amt;
    });

    const netProfit = totalIncome - totalExpenses;

    const byMonthMap = {};
    const add = (date, amount, key) => {
      const d = date ? new Date(date) : new Date();
      const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonthMap[m]) byMonthMap[m] = { month: m, income: 0, expenses: 0 };
      byMonthMap[m][key] += amount;
    };
    payments.forEach((p) => add(p.createdAt, Number(p.amount || 0), 'income'));
    restaurantBills.forEach((b) => add(b.createdAt, Number(b.totalAmount || 0), 'income'));
    barOrders.forEach((b) => add(b.createdAt, Number(b.totalAmount || 0), 'income'));
    expenses.forEach((e) => add(e.expenseDate || e.createdAt, Number(e.amount || 0), 'expenses'));

    const departmentWise = [
      { name: 'Rooms', income: roomIncome, expenses: 0, profit: roomIncome },
      { name: 'Restaurant', income: restaurantIncome, expenses: 0, profit: restaurantIncome },
      { name: 'Bar / Other', income: barIncome, expenses: 0, profit: barIncome },
    ];

    res.json({
      period: {
        start: rangeStart.toISOString(),
        end: rangeEnd.toISOString(),
      },
      income: {
        totalIncome,
        roomIncome,
        restaurantIncome,
        barIncome,
      },
      expenses: {
        totalExpenses,
        byCategory: expenseByCategory,
      },
      netProfit,
      byMonth: Object.values(byMonthMap).map((m) => ({
        ...m,
        profit: m.income - m.expenses,
      })),
      departmentWise,
    });
  } catch (error) {
    console.error('Profit & loss error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== BALANCE SHEET ====================

router.get('/:hotelId/balance-sheet', getHotelContext, async (req, res) => {
  try {
    const { AccountHead, JournalEntry } = req.hotelModels;
    await AccountHead.sync();
    await JournalEntry.sync();

    const asOf = req.query.asOf ? new Date(req.query.asOf) : new Date();

    const accounts = await AccountHead.findAll({
      where: { status: 'Active' },
      order: [['accountType', 'ASC'], ['code', 'ASC']],
    });

    const entries = await JournalEntry.findAll({
      where: { autoPosted: true, date: { [Op.lte]: asOf } },
      attributes: ['lines'],
    });

    const balanceById = {};

    // Opening balances
    accounts.forEach((a) => {
      const opening = Number(a.openingBalance || 0) * (a.balanceType === 'Debit' ? 1 : -1);
      balanceById[a.id] = opening;
    });

    // Movements from journal entries
    entries.forEach((e) => {
      const lines = e.lines || [];
      lines.forEach((l) => {
        if (!l.accountId) return;
        const delta = Number(l.debit || 0) - Number(l.credit || 0);
        balanceById[l.accountId] = (balanceById[l.accountId] || 0) + delta;
      });
    });

    const assetAccounts = [];
    const liabilityAccounts = [];
    const equityAccounts = [];

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    accounts.forEach((a) => {
      const raw = balanceById[a.id] || 0;
      const balance = Math.abs(raw);
      const base = {
        id: a.id,
        code: a.code,
        name: a.name,
        balance,
      };
      if (a.accountType === 'Asset') {
        assetAccounts.push(base);
        totalAssets += balance;
      } else if (a.accountType === 'Liability') {
        liabilityAccounts.push(base);
        totalLiabilities += balance;
      } else if (a.accountType === 'Equity') {
        equityAccounts.push(base);
        totalEquity += balance;
      }
    });

    const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;

    res.json({
      asOf: asOf.toISOString(),
      assets: { totalAssets, accounts: assetAccounts },
      liabilities: { totalLiabilities, accounts: liabilityAccounts },
      equity: { totalEquity, accounts: equityAccounts },
      isBalanced,
    });
  } catch (error) {
    console.error('Balance sheet error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== TRIAL BALANCE ====================

router.get('/:hotelId/trial-balance', getHotelContext, async (req, res) => {
  try {
    const { AccountHead, JournalEntry } = req.hotelModels;
    await AccountHead.sync();
    await JournalEntry.sync();

    const asOf = req.query.asOf ? new Date(req.query.asOf) : new Date();

    const accounts = await AccountHead.findAll({
      where: { status: 'Active' },
      order: [['accountType', 'ASC'], ['code', 'ASC']],
    });

    const entries = await JournalEntry.findAll({
      where: { autoPosted: true, date: { [Op.lte]: asOf } },
      attributes: ['lines'],
    });

    const balanceById = {};

    // Opening balances
    accounts.forEach((a) => {
      const opening = Number(a.openingBalance || 0) * (a.balanceType === 'Debit' ? 1 : -1);
      balanceById[a.id] = opening;
    });

    // Movements from journal entries
    entries.forEach((e) => {
      const lines = e.lines || [];
      lines.forEach((l) => {
        if (!l.accountId) return;
        const delta = Number(l.debit || 0) - Number(l.credit || 0);
        balanceById[l.accountId] = (balanceById[l.accountId] || 0) + delta;
      });
    });

    const rows = accounts.map((a) => {
      const raw = balanceById[a.id] || 0;
      const debit = raw > 0 ? Math.abs(raw) : 0;
      const credit = raw < 0 ? Math.abs(raw) : 0;
      return {
        id: a.id,
        code: a.code,
        name: a.name,
        accountType: a.accountType,
        debit,
        credit,
      };
    }).filter((r) => r.debit > 0 || r.credit > 0);

    const totalDebit = rows.reduce((s, r) => s + Number(r.debit || 0), 0);
    const totalCredit = rows.reduce((s, r) => s + Number(r.credit || 0), 0);
    const difference = Math.abs(totalDebit - totalCredit);
    const isBalanced = difference < 0.01;

    res.json({
      asOf: asOf.toISOString(),
      rows,
      totalDebit,
      totalCredit,
      isBalanced,
      difference: isBalanced ? 0 : totalDebit - totalCredit,
    });
  } catch (error) {
    console.error('Trial balance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put(
  '/:hotelId/invoices/:id',
  getHotelContext,
  [],
  async (req, res) => {
    try {
      const { Invoice } = req.hotelModels;
      await Invoice.sync();
      const invoice = await Invoice.findByPk(req.params.id);
      if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

      const updates = {};
      const fields = [
        'guestName',
        'issueDate',
        'dueDate',
        'status',
        'subtotal',
        'taxAmount',
        'totalAmount',
        'taxPercent',
        'notes',
        'items',
      ];
      for (const f of fields) {
        if (req.body[f] !== undefined) {
          updates[f] =
            ['subtotal', 'taxAmount', 'totalAmount', 'taxPercent'].includes(f) && req.body[f] != null
              ? Number(req.body[f])
              : req.body[f];
        }
      }

      await invoice.update(updates);
      res.json({ invoice: invoice.toJSON() });
    } catch (error) {
      console.error('Update invoice error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// ==================== EXPENSES & FINANCE DASHBOARD ====================

router.get('/:hotelId/expenses', getHotelContext, async (req, res) => {
  try {
    const { Expense } = req.hotelModels;
    try { await Expense.sync({ alter: true }); } catch (e) { console.warn('Expense sync:', e.message); }
    const where = {};
    if (req.query.category) where.category = req.query.category;
    if (req.query.startDate) where.expenseDate = { [Op.gte]: req.query.startDate };
    if (req.query.endDate) where.expenseDate = { ...(where.expenseDate || {}), [Op.lte]: req.query.endDate };
    const expenses = await Expense.findAll({ where, order: [['expenseDate', 'DESC'], ['createdAt', 'DESC']] });
    res.json({ expenses: expenses.map((e) => e.toJSON()) });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:hotelId/expenses', getHotelContext, [
  body('category').trim().notEmpty(),
  body('amount').isNumeric(),
  body('expenseDate').optional().isISO8601(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { Expense } = req.hotelModels;
    const payload = {
      category: req.body.category,
      amount: req.body.amount,
      description: req.body.description || null,
      expenseDate: req.body.expenseDate || new Date().toISOString().slice(0, 10),
      paymentMethod: req.body.paymentMethod || null,
      vendor: req.body.vendor || null,
      status: req.body.status || 'Paid',
    };
    const expense = await Expense.create(payload);
    res.status(201).json({ expense: expense.toJSON() });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:hotelId/finance-dashboard', getHotelContext, async (req, res) => {
  try {
    const { Payment, RestaurantBill, BarOrder, Expense } = req.hotelModels;
    try { if (Expense) await Expense.sync({ alter: true }); } catch (e) { console.warn('Expense sync:', e.message); }

    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
    const daysBack = 90;
    const rangeStart = startDate || (() => { const d = new Date(); d.setDate(d.getDate() - daysBack); return d; })();
    const rangeEnd = endDate || new Date();

    const dateFilter = { [Op.gte]: rangeStart, [Op.lte]: rangeEnd };
    const baseWherePayment = { status: 'completed', createdAt: dateFilter };
    const baseWhereRestaurant = { status: 'Paid', createdAt: dateFilter };
    const baseWhereBar = { status: 'Served', createdAt: dateFilter };

    const expenseWhere = { status: 'Paid', expenseDate: { [Op.gte]: rangeStart, [Op.lte]: rangeEnd } };
    const [payments, restaurantBills, barOrders, expenses] = await Promise.all([
      Payment.findAll({ where: baseWherePayment, attributes: ['id', 'amount', 'createdAt', 'paymentMethod', 'guestName'] }),
      RestaurantBill.findAll({ where: baseWhereRestaurant, attributes: ['id', 'totalAmount', 'createdAt'] }),
      BarOrder.findAll({ where: baseWhereBar, attributes: ['id', 'totalAmount', 'createdAt'] }),
      Expense.findAll({ where: expenseWhere, order: [['expenseDate', 'DESC']], attributes: ['id', 'category', 'amount', 'expenseDate', 'description', 'createdAt'] }),
    ]);

    let totalRevenue = 0;
    payments.forEach((p) => { totalRevenue += Number(p.amount || 0); });
    restaurantBills.forEach((b) => { totalRevenue += Number(b.totalAmount || 0); });
    barOrders.forEach((b) => { totalRevenue += Number(b.totalAmount || 0); });

    let totalExpenses = 0;
    const expenseByCategory = {};
    expenses.forEach((e) => {
      const amt = Number(e.amount || 0);
      totalExpenses += amt;
      const cat = e.category || 'Other';
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + amt;
    });

    const byMonth = {};
    const addToMonth = (date, amount, isInflow) => {
      const d = date ? new Date(date) : new Date();
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[key]) byMonth[key] = { revenue: 0, expenses: 0 };
      if (isInflow) byMonth[key].revenue += amount;
      else byMonth[key].expenses += amount;
    };
    payments.forEach((p) => addToMonth(p.createdAt, Number(p.amount || 0), true));
    restaurantBills.forEach((b) => addToMonth(b.createdAt, Number(b.totalAmount || 0), true));
    barOrders.forEach((b) => addToMonth(b.createdAt, Number(b.totalAmount || 0), true));
    expenses.forEach((e) => addToMonth(e.expenseDate || e.createdAt, Number(e.amount || 0), false));

    const recentActivity = [];
    payments.slice(0, 15).forEach((p) => {
      recentActivity.push({ id: p.id, type: 'income', source: 'Room Payment', amount: Number(p.amount || 0), date: p.createdAt, description: p.guestName || 'Payment' });
    });
    restaurantBills.slice(0, 10).forEach((b) => {
      recentActivity.push({ id: b.id, type: 'income', source: 'Restaurant', amount: Number(b.totalAmount || 0), date: b.createdAt, description: 'Restaurant Bill' });
    });
    barOrders.slice(0, 10).forEach((b) => {
      recentActivity.push({ id: b.id, type: 'income', source: 'Bar', amount: Number(b.totalAmount || 0), date: b.createdAt, description: 'Bar Order' });
    });
    expenses.slice(0, 15).forEach((e) => {
      recentActivity.push({ id: e.id, type: 'expense', source: e.category, amount: Number(e.amount || 0), date: e.expenseDate || e.createdAt, description: e.description || e.category });
    });
    recentActivity.sort((a, b) => new Date(b.date) - new Date(a.date));

    const revenueByDay = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      let rev = 0;
      payments.forEach((p) => { if (p.createdAt && new Date(p.createdAt).toISOString().slice(0, 10) === key) rev += Number(p.amount || 0); });
      restaurantBills.forEach((b) => { if (b.createdAt && new Date(b.createdAt).toISOString().slice(0, 10) === key) rev += Number(b.totalAmount || 0); });
      barOrders.forEach((b) => { if (b.createdAt && new Date(b.createdAt).toISOString().slice(0, 10) === key) rev += Number(b.totalAmount || 0); });
      revenueByDay.push({ date: key, value: rev });
    }

    res.json({
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      expenseByCategory,
      byMonth: Object.entries(byMonth).map(([month, v]) => ({ month, ...v })),
      recentActivity: recentActivity.slice(0, 25),
      revenueByDay,
    });
  } catch (error) {
    console.error('Finance dashboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== BILLING DASHBOARD ====================

router.get('/:hotelId/billing-dashboard', getHotelContext, async (req, res) => {
  try {
    const { Invoice, Payment, RestaurantBill, BarOrder } = req.hotelModels;
    await Invoice.sync().catch(() => {});
    await Payment.sync().catch(() => {});

    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
    const period = req.query.period || 'monthly';
    const now = new Date();
    let rangeStart;
    let rangeEnd = endDate || now;

    if (startDate && endDate) {
      rangeStart = startDate;
      rangeEnd = endDate;
    } else if (period === 'today') {
      rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      rangeEnd = now;
    } else if (period === 'weekly') {
      rangeStart = new Date(now);
      rangeStart.setDate(rangeStart.getDate() - 7);
    } else if (period === 'monthly') {
      rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      rangeStart = new Date(now);
      rangeStart.setDate(rangeStart.getDate() - 30);
    }

    const dateFilter = { [Op.gte]: rangeStart, [Op.lte]: rangeEnd };
    const invWhere = { issueDate: dateFilter, status: { [Op.ne]: 'CANCELLED' } };
    const payWhere = { status: 'completed', createdAt: dateFilter };
    const restWhere = { createdAt: dateFilter };
    const barWhere = { status: 'Served', createdAt: dateFilter };

    const [invoices, payments, restaurantBills, barOrders] = await Promise.all([
      Invoice.findAll({ where: invWhere, order: [['issueDate', 'DESC'], ['createdAt', 'DESC']] }),
      Payment.findAll({ where: payWhere }),
      RestaurantBill.findAll({ where: restWhere }),
      BarOrder ? BarOrder.findAll({ where: barWhere }) : [],
    ]);

    const totalBills = invoices.length + restaurantBills.length;
    let totalBilledAmount = 0;
    invoices.forEach((i) => { totalBilledAmount += Number(i.totalAmount || 0); });
    restaurantBills.forEach((b) => {
      if (b.status !== 'Cancelled') totalBilledAmount += Number(b.totalAmount || 0);
    });

    const paidBills = invoices.filter((i) => i.status === 'PAID').length +
      restaurantBills.filter((b) => b.status === 'Paid' || b.status === 'Refunded').length;
    let pendingAmount = 0;
    invoices.filter((i) => i.status === 'PENDING' || i.status === 'OVERDUE').forEach((i) => {
      pendingAmount += Number(i.totalAmount || 0);
    });
    restaurantBills.filter((b) => b.status === 'Pending').forEach((b) => {
      pendingAmount += Number(b.totalAmount || 0);
    });

    let paidAmount = 0;
    invoices.filter((i) => i.status === 'PAID').forEach((i) => { paidAmount += Number(i.totalAmount || 0); });
    restaurantBills.filter((b) => b.status === 'Paid').forEach((b) => { paidAmount += Number(b.totalAmount || 0); });
    payments.forEach((p) => { paidAmount += Number(p.amount || 0); });

    const overdueCount = invoices.filter((i) => i.status === 'OVERDUE').length;
    const collectionPercent = totalBilledAmount > 0 ? Math.round((paidAmount / totalBilledAmount) * 100) : 100;

    let roomRevenue = 0;
    payments.forEach((p) => { roomRevenue += Number(p.amount || 0); });
    let restaurantRevenue = 0;
    restaurantBills.filter((b) => b.status === 'Paid').forEach((b) => {
      restaurantRevenue += Number(b.totalAmount || 0) - Number(b.refundedAmount || 0);
    });
    let otherCharges = 0;
    invoices.filter((i) => i.status === 'PAID').forEach((i) => { otherCharges += Number(i.totalAmount || 0); });
    barOrders.forEach((b) => { otherCharges += Number(b.totalAmount || 0); });
    let refunds = 0;
    restaurantBills.forEach((b) => { refunds += Number(b.refundedAmount || 0); });
    payments.filter((p) => p.status === 'refunded').forEach((p) => { refunds += Number(p.amount || 0); });

    let totalRefundAmount = refunds;
    const refundCount = restaurantBills.filter((b) => b.status === 'Refunded').length +
      payments.filter((p) => p.status === 'refunded').length;
    const creditNotesIssued = 0;
    const netAdjustedRevenue = roomRevenue + restaurantRevenue + otherCharges - totalRefundAmount;

    const recentTransactions = [];
    invoices.slice(0, 20).forEach((i) => {
      recentTransactions.push({
        id: i.id,
        type: 'invoice',
        invoiceNumber: i.invoiceNumber,
        guestName: i.guestName,
        billType: 'Invoice',
        amount: Number(i.totalAmount || 0),
        paymentStatus: i.status,
        date: i.issueDate,
        createdAt: i.createdAt,
      });
    });
    restaurantBills.slice(0, 20).forEach((b) => {
      recentTransactions.push({
        id: b.id,
        type: 'restaurant',
        invoiceNumber: `TB-${(b.id || '').slice(0, 8)}`,
        guestName: b.guestName || 'Walk-in',
        billType: 'Restaurant',
        amount: Number(b.totalAmount || 0),
        paymentStatus: b.status,
        date: b.createdAt,
        createdAt: b.createdAt,
      });
    });
    recentTransactions.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

    res.json({
      startDate: rangeStart.toISOString(),
      endDate: rangeEnd.toISOString(),
      kpis: {
        totalBills,
        totalBilledAmount,
        paidBills,
        pendingAmount,
      },
      paymentStatus: {
        paidAmount,
        pendingAmount,
        overdueCount,
        collectionPercent,
      },
      revenue: {
        roomRevenue,
        restaurantRevenue,
        otherCharges,
        refunds,
        total: roomRevenue + restaurantRevenue + otherCharges - refunds,
      },
      refundCreditNote: {
        totalRefundAmount,
        refundCount,
        creditNotesIssued,
        netAdjustedRevenue,
      },
      recentTransactions: recentTransactions.slice(0, 30),
    });
  } catch (error) {
    console.error('Billing dashboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== CHART OF ACCOUNTS ====================

const ACCOUNT_TYPE_PREFIX = { Asset: 1000, Liability: 2000, Income: 3000, Expense: 4000, Equity: 5000 };

router.get('/:hotelId/chart-of-accounts', getHotelContext, async (req, res) => {
  try {
    const { AccountHead } = req.hotelModels;
    try { await AccountHead.sync({ alter: true }); } catch (e) { console.warn('AccountHead sync:', e.message); }
    const where = {};
    if (req.query.accountType) where.accountType = req.query.accountType;
    if (req.query.status) where.status = req.query.status;
    const flat = await AccountHead.findAll({ where, order: [['code', 'ASC']] });
    const tree = buildAccountTree(flat.map((a) => a.toJSON()), null);
    res.json({ accounts: flat.map((a) => a.toJSON()), tree });
  } catch (error) {
    console.error('Chart of accounts list error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

function buildAccountTree(accounts, parentId) {
  return accounts
    .filter((a) => (a.parentId || null) === (parentId || null))
    .map((a) => ({ ...a, children: buildAccountTree(accounts, a.id) }));
}

router.get('/:hotelId/chart-of-accounts/next-code', getHotelContext, async (req, res) => {
  try {
    const { AccountHead } = req.hotelModels;
    const accountType = req.query.accountType || 'Asset';
    const prefix = ACCOUNT_TYPE_PREFIX[accountType] || 1000;
    const existing = await AccountHead.findAll({
      where: { accountType },
      attributes: ['code'],
      order: [['code', 'DESC']],
      limit: 1,
    });
    let next = prefix;
    if (existing.length > 0) {
      const last = String(existing[0].code).replace(/\D/g, '');
      const num = parseInt(last, 10);
      if (!isNaN(num) && num >= prefix) next = num + 1;
    }
    res.json({ code: String(next), accountType });
  } catch (error) {
    console.error('Next code error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:hotelId/chart-of-accounts', getHotelContext, [
  body('code').trim().notEmpty(),
  body('name').trim().notEmpty(),
  body('accountType').isIn(['Asset', 'Liability', 'Income', 'Expense', 'Equity']),
  body('openingBalance').optional().isFloat({ min: 0 }),
  body('balanceType').optional().isIn(['Debit', 'Credit']),
  body('status').optional().isIn(['Active', 'Inactive']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { AccountHead } = req.hotelModels;
    const existing = await AccountHead.findOne({ where: { code: req.body.code } });
    if (existing) return res.status(400).json({ message: 'Account code already exists' });
    const payload = {
      code: req.body.code.trim(),
      name: req.body.name.trim(),
      accountType: req.body.accountType,
      parentId: req.body.parentId || null,
      openingBalance: Number(req.body.openingBalance || 0),
      balanceType: req.body.balanceType || 'Debit',
      status: req.body.status || 'Active',
      description: req.body.description || null,
      currency: req.body.currency || 'USD',
    };
    const account = await AccountHead.create(payload);
    res.status(201).json({ account: account.toJSON() });
  } catch (error) {
    console.error('Create account head error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:hotelId/chart-of-accounts/:id', getHotelContext, async (req, res) => {
  try {
    const { AccountHead } = req.hotelModels;
    const account = await AccountHead.findByPk(req.params.id);
    if (!account) return res.status(404).json({ message: 'Account not found' });
    res.json({ account: account.toJSON() });
  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:hotelId/chart-of-accounts/:id', getHotelContext, [
  body('name').optional().trim().notEmpty(),
  body('accountType').optional().isIn(['Asset', 'Liability', 'Income', 'Expense', 'Equity']),
  body('openingBalance').optional().isFloat({ min: 0 }),
  body('balanceType').optional().isIn(['Debit', 'Credit']),
  body('status').optional().isIn(['Active', 'Inactive']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { AccountHead } = req.hotelModels;
    const account = await AccountHead.findByPk(req.params.id);
    if (!account) return res.status(404).json({ message: 'Account not found' });
    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name.trim();
    if (req.body.accountType !== undefined) updates.accountType = req.body.accountType;
    if (req.body.parentId !== undefined) updates.parentId = req.body.parentId || null;
    if (req.body.openingBalance !== undefined) updates.openingBalance = Number(req.body.openingBalance);
    if (req.body.balanceType !== undefined) updates.balanceType = req.body.balanceType;
    if (req.body.status !== undefined) updates.status = req.body.status;
    if (req.body.description !== undefined) updates.description = req.body.description;
    await account.update(updates);
    res.json({ account: account.toJSON() });
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:hotelId/chart-of-accounts/:id', getHotelContext, async (req, res) => {
  try {
    const { AccountHead } = req.hotelModels;
    const account = await AccountHead.findByPk(req.params.id);
    if (!account) return res.status(404).json({ message: 'Account not found' });
    const children = await AccountHead.count({ where: { parentId: account.id } });
    if (children > 0) return res.status(400).json({ message: 'Cannot delete account with sub-accounts. Remove or reassign sub-accounts first.' });
    await account.destroy();
    res.json({ message: 'Account deleted' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== GUEST LEDGER ====================

function ledgerBalance(entries) {
  let balance = 0;
  (entries || []).forEach((e) => {
    const amt = Number(e.amount || 0);
    balance += e.isDebit ? amt : -amt;
  });
  return balance;
}

router.get('/:hotelId/guest-ledger', getHotelContext, async (req, res) => {
  try {
    const { Booking, Payment, GuestLedgerEntry } = req.hotelModels;
    try { if (GuestLedgerEntry) await GuestLedgerEntry.sync({ alter: true }); } catch (e) { console.warn('GuestLedgerEntry sync:', e.message); }
    const bookings = await Booking.findAll({
      where: { status: { [Op.notIn]: ['cancelled'] } },
      order: [['checkIn', 'DESC']],
    });
    const entries = await GuestLedgerEntry.findAll({ order: [['createdAt', 'ASC']] });
    const payments = await Payment.findAll({ where: { status: 'completed' } });
    const list = bookings.map((b) => {
      const bookingEntries = entries.filter((e) => e.bookingId === b.id);
      const bookingPayments = payments.filter((p) => p.bookingId === b.id);
      const chargesFromLedger = bookingEntries.filter((e) => e.isDebit).reduce((s, e) => s + Number(e.amount || 0), 0);
      const creditsFromLedger = bookingEntries.filter((e) => !e.isDebit).reduce((s, e) => s + Number(e.amount || 0), 0);
      const totalCharges = chargesFromLedger > 0 ? chargesFromLedger : Number(b.totalAmount || 0);
      const totalPaid = creditsFromLedger > 0 ? creditsFromLedger : bookingPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
      const balance = totalCharges - totalPaid;
      return {
        id: b.id,
        bookingNumber: b.bookingNumber,
        guestId: b.guestId,
        guestName: b.guestName,
        roomNumber: b.roomNumber,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        totalAmount: totalCharges,
        totalPaid,
        balance,
        status: balance <= 0 ? 'Paid' : balance > 0 && new Date(b.checkOut) < new Date() ? 'Overdue' : 'Pending',
      };
    });
    res.json({ list });
  } catch (error) {
    console.error('Guest ledger list error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:hotelId/guest-ledger/outstanding', getHotelContext, async (req, res) => {
  try {
    const { Booking, Payment, GuestLedgerEntry } = req.hotelModels;
    const bookings = await Booking.findAll({ where: { status: { [Op.notIn]: ['cancelled'] } }, order: [['checkOut', 'ASC']] });
    const entries = await GuestLedgerEntry.findAll({ order: [['createdAt', 'ASC']] });
    const payments = await Payment.findAll({ where: { status: 'completed' } });
    const outstanding = [];
    bookings.forEach((b) => {
      const bookingEntries = entries.filter((e) => e.bookingId === b.id);
      const bookingPayments = payments.filter((p) => p.bookingId === b.id);
      const charges = bookingEntries.filter((e) => e.isDebit).reduce((s, e) => s + Number(e.amount || 0), 0) || Number(b.totalAmount || 0);
      const credits = bookingEntries.filter((e) => !e.isDebit).reduce((s, e) => s + Number(e.amount || 0), 0) || bookingPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
      const balance = charges - credits;
      if (balance > 0) outstanding.push({ ...b.toJSON(), balance, totalCharges: charges, totalPaid: credits });
    });
    res.json({ outstanding });
  } catch (error) {
    console.error('Guest ledger outstanding error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:hotelId/guest-ledger/booking/:bookingId', getHotelContext, async (req, res) => {
  try {
    const { Booking, Payment, GuestLedgerEntry } = req.hotelModels;
    const booking = await Booking.findByPk(req.params.bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    const entries = await GuestLedgerEntry.findAll({ where: { bookingId: req.params.bookingId }, order: [['createdAt', 'ASC']] });
    const payments = await Payment.findAll({ where: { bookingId: req.params.bookingId, status: 'completed' }, order: [['createdAt', 'ASC']] });
    const transactions = [];
    const sorted = [
      ...entries.map((e) => ({ ...e.toJSON(), isEntry: true })),
      ...payments.map((p) => ({ id: p.id, type: 'PAYMENT', description: `Payment - ${p.paymentMethod}`, amount: Number(p.amount), isDebit: false, createdAt: p.createdAt, isEntry: false })),
    ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    let running = 0;
    sorted.forEach((row) => {
      const amt = Number(row.amount || 0);
      running += row.isDebit ? amt : -amt;
      transactions.push({ ...row, balance: running });
    });
    const charges = entries.filter((e) => e.isDebit).reduce((s, e) => s + Number(e.amount || 0), 0) || Number(booking.totalAmount || 0);
    const credits = entries.filter((e) => !e.isDebit).reduce((s, e) => s + Number(e.amount || 0), 0) + payments.reduce((s, p) => s + Number(p.amount || 0), 0);
    res.json({ booking: booking.toJSON(), transactions, balance: charges - credits, totalCharges: charges, totalPaid: credits });
  } catch (error) {
    console.error('Guest ledger booking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:hotelId/guest-ledger/entry', getHotelContext, [
  body('guestId').trim().notEmpty(),
  body('bookingId').optional().trim(),
  body('type').isIn(['ROOM_CHARGE', 'RESTAURANT', 'ADVANCE', 'ADJUSTMENT', 'REFUND', 'EXTRA_BED', 'LATE_CHECKOUT']),
  body('description').optional().trim(),
  body('amount').isFloat({ min: 0 }),
  body('isDebit').optional().isBoolean(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { GuestLedgerEntry } = req.hotelModels;
    const isDebit = req.body.type === 'REFUND' ? false : req.body.type !== 'ADVANCE' && req.body.type !== 'ADJUSTMENT';
    const entry = await GuestLedgerEntry.create({
      guestId: req.body.guestId,
      bookingId: req.body.bookingId || null,
      type: req.body.type,
      description: req.body.description || null,
      amount: Math.abs(Number(req.body.amount)),
      isDebit: req.body.isDebit !== undefined ? req.body.isDebit : isDebit,
      referenceId: req.body.referenceId || null,
    });
    res.status(201).json({ entry: entry.toJSON() });
  } catch (error) {
    console.error('Guest ledger entry error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:hotelId/guest-ledger/guest/:guestId/credit-limit', getHotelContext, [
  body('creditLimit').optional().isFloat({ min: 0 }),
], async (req, res) => {
  try {
    const { Guest } = req.hotelModels;
    const guest = await Guest.findByPk(req.params.guestId);
    if (!guest) return res.status(404).json({ message: 'Guest not found' });
    await guest.update({ creditLimit: req.body.creditLimit != null ? Number(req.body.creditLimit) : null });
    res.json({ guest: guest.toJSON() });
  } catch (error) {
    console.error('Guest credit limit error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:hotelId/guest-ledger/restaurant-bills', getHotelContext, async (req, res) => {
  try {
    const { RestaurantBill } = req.hotelModels;
    const bills = await RestaurantBill.findAll({ where: { status: 'Paid' }, order: [['createdAt', 'DESC']], limit: 50 });
    res.json({ bills: bills.map((b) => b.toJSON()) });
  } catch (error) {
    console.error('Restaurant bills error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:hotelId/guest-ledger/post-restaurant', getHotelContext, [
  body('bookingId').trim().notEmpty(),
  body('guestId').trim().notEmpty(),
  body('billId').trim().notEmpty(),
  body('amount').isFloat({ min: 0 }),
  body('description').optional().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { GuestLedgerEntry } = req.hotelModels;
    const entry = await GuestLedgerEntry.create({
      guestId: req.body.guestId,
      bookingId: req.body.bookingId,
      type: 'RESTAURANT',
      description: req.body.description || 'Restaurant bill',
      amount: Number(req.body.amount),
      isDebit: true,
      referenceId: req.body.billId,
    });
    res.status(201).json({ entry: entry.toJSON() });
  } catch (error) {
    console.error('Post restaurant error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== CASH & BANK ====================

router.get('/:hotelId/cash-bank/accounts', getHotelContext, async (req, res) => {
  try {
    const { CashBankAccount, CashBankEntry } = req.hotelModels;

    // Ensure Cash & Bank tables exist for this hotel schema
    await CashBankAccount.sync();
    await CashBankEntry.sync();
    const where = {};
    if (req.query.type) where.type = req.query.type;
    const accounts = await CashBankAccount.findAll({ where, order: [['type', 'ASC'], ['name', 'ASC']] });
    res.json({ accounts: accounts.map((a) => a.toJSON()) });
  } catch (error) {
    console.error('CashBank accounts error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:hotelId/cash-bank/accounts', getHotelContext, [
  body('name').trim().notEmpty(),
  body('type').isIn(['CASH', 'BANK']),
  body('openingBalance').optional().isFloat({ min: 0 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { CashBankAccount } = req.hotelModels;
    const account = await CashBankAccount.create({
      name: req.body.name.trim(),
      type: req.body.type,
      accountNumber: req.body.accountNumber || null,
      ifsc: req.body.ifsc || null,
      openingBalance: Number(req.body.openingBalance || 0),
      currentBalance: Number(req.body.openingBalance || 0),
      currency: req.body.currency || 'USD',
      isActive: req.body.isActive !== false,
    });
    res.status(201).json({ account: account.toJSON() });
  } catch (error) {
    console.error('Create CashBank account error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:hotelId/cash-bank/accounts/:id', getHotelContext, [
  body('name').optional().trim().notEmpty(),
  body('isActive').optional().isBoolean(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { CashBankAccount } = req.hotelModels;
    const account = await CashBankAccount.findByPk(req.params.id);
    if (!account) return res.status(404).json({ message: 'Account not found' });
    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name.trim();
    if (req.body.accountNumber !== undefined) updates.accountNumber = req.body.accountNumber || null;
    if (req.body.ifsc !== undefined) updates.ifsc = req.body.ifsc || null;
    if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;
    await account.update(updates);
    res.json({ account: account.toJSON() });
  } catch (error) {
    console.error('Update CashBank account error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:hotelId/cash-bank/entries', getHotelContext, async (req, res) => {
  try {
    const { CashBankEntry } = req.hotelModels;
    const where = {};
    if (req.query.accountId) where.accountId = req.query.accountId;
    if (req.query.startDate || req.query.endDate) {
      where.date = {};
      if (req.query.startDate) where.date[Op.gte] = req.query.startDate;
      if (req.query.endDate) where.date[Op.lte] = req.query.endDate;
    }
    const entries = await CashBankEntry.findAll({ where, order: [['date', 'ASC'], ['createdAt', 'ASC']] });
    let running = 0;
    const withBalance = entries.map((e) => {
      const amt = Number(e.amount || 0);
      running += e.isDebit ? amt : -amt;
      const json = e.toJSON();
      return { ...json, balance: running };
    });
    res.json({ entries: withBalance });
  } catch (error) {
    console.error('CashBank entries error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:hotelId/cash-bank/entries', getHotelContext, [
  body('accountId').trim().notEmpty(),
  body('date').isISO8601(),
  body('type').isIn(['DEPOSIT', 'WITHDRAWAL', 'TRANSFER_IN', 'TRANSFER_OUT', 'CHARGE', 'ADJUSTMENT']),
  body('amount').isFloat({ min: 0 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { CashBankAccount, CashBankEntry } = req.hotelModels;
    const account = await CashBankAccount.findByPk(req.body.accountId);
    if (!account) return res.status(404).json({ message: 'Account not found' });
    const baseDebit = req.body.type === 'DEPOSIT' || req.body.type === 'TRANSFER_IN';
    const isDebit = req.body.isDebit !== undefined ? !!req.body.isDebit : baseDebit;
    const amount = Math.abs(Number(req.body.amount));
    const entry = await CashBankEntry.create({
      accountId: account.id,
      date: req.body.date,
      type: req.body.type,
      amount,
      description: req.body.description || null,
      referenceNo: req.body.referenceNo || null,
      isDebit,
    });
    const delta = isDebit ? amount : -amount;
    await account.update({ currentBalance: Number(account.currentBalance || 0) + delta });
    res.status(201).json({ entry: entry.toJSON() });
  } catch (error) {
    console.error('Create CashBank entry error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:hotelId/cash-bank/daily-summary', getHotelContext, async (req, res) => {
  try {
    const { CashBankAccount, CashBankEntry } = req.hotelModels;
    await CashBankAccount.sync();
    await CashBankEntry.sync();
    const dateStr = req.query.date || new Date().toISOString().slice(0, 10);
    const cashAccount = await CashBankAccount.findOne({ where: { type: 'CASH', isActive: true } });
    if (!cashAccount) return res.json({ openingBalance: 0, totalInflow: 0, totalOutflow: 0, closingBalance: 0 });

    const todayEntries = await CashBankEntry.findAll({
      where: { accountId: cashAccount.id, date: dateStr },
      order: [['createdAt', 'ASC']],
    });
    const totalInflow = todayEntries.filter((e) => e.isDebit).reduce((s, e) => s + Number(e.amount || 0), 0);
    const totalOutflow = todayEntries.filter((e) => !e.isDebit).reduce((s, e) => s + Number(e.amount || 0), 0);

    const priorEntries = await CashBankEntry.findAll({
      where: { accountId: cashAccount.id, date: { [Op.lt]: dateStr } },
      order: [['date', 'ASC'], ['createdAt', 'ASC']],
    });
    const priorBalance = priorEntries.reduce((s, e) => s + (e.isDebit ? Number(e.amount || 0) : -Number(e.amount || 0)), 0);
    const openingBalance = Number(cashAccount.openingBalance || 0) + priorBalance;
    const closingBalance = openingBalance + totalInflow - totalOutflow;

    res.json({ openingBalance, totalInflow, totalOutflow, closingBalance });
  } catch (error) {
    console.error('CashBank daily summary error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:hotelId/cash-bank/reconciliation', getHotelContext, async (req, res) => {
  try {
    const { CashBankAccount, CashBankEntry } = req.hotelModels;
    const accountId = req.query.accountId;
    if (!accountId) return res.status(400).json({ message: 'accountId is required' });
    const account = await CashBankAccount.findByPk(accountId);
    if (!account) return res.status(404).json({ message: 'Account not found' });
    const entries = await CashBankEntry.findAll({
      where: { accountId },
      order: [['date', 'ASC'], ['createdAt', 'ASC']],
    });
    const bookBalance = Number(account.currentBalance || 0);
    const unreconciled = entries.filter((e) => !e.reconciled);
    const unpresentedCheques = unreconciled.filter((e) => !e.isDebit);
    const uncreditedDeposits = unreconciled.filter((e) => e.isDebit);
    const unreconciledTotal = unreconciled.reduce((s, e) => s + (e.isDebit ? Number(e.amount || 0) : -Number(e.amount || 0)), 0);
    const adjustedBalance = bookBalance - unreconciledTotal;
    res.json({
      account: account.toJSON(),
      bookBalance,
      adjustedBalance,
      unpresentedCheques: unpresentedCheques.map((e) => e.toJSON()),
      uncreditedDeposits: uncreditedDeposits.map((e) => e.toJSON()),
      difference: bookBalance - adjustedBalance,
    });
  } catch (error) {
    console.error('CashBank reconciliation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== DAY CLOSING ====================

router.get('/:hotelId/day-closing/overview', getHotelContext, async (req, res) => {
  try {
    const { Payment, RestaurantBill, CashBankAccount, DayClosing } = req.hotelModels;
    await DayClosing.sync();
    const dateStr = req.query.date || new Date().toISOString().slice(0, 10);
    const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
    const endOfDay = new Date(dateStr + 'T23:59:59.999Z');

    const existing = await DayClosing.findOne({ where: { date: dateStr } });

    const [roomPayments, restaurantBills, cashAccount] = await Promise.all([
      Payment.findAll({
        where: {
          status: 'completed',
          createdAt: { [Op.between]: [startOfDay, endOfDay] },
        },
      }),
      RestaurantBill.findAll({
        where: {
          status: 'Paid',
          createdAt: { [Op.between]: [startOfDay, endOfDay] },
        },
      }),
      CashBankAccount.findOne({ where: { type: 'CASH', isActive: true } }),
    ]);

    const roomRevenue = roomPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const restaurantRevenue = restaurantBills.reduce((sum, b) => sum + Number(b.grandTotal || 0), 0);
    const otherIncome = Number(existing?.otherIncome || 0);
    const totalRevenue = roomRevenue + restaurantRevenue + otherIncome;

    const systemCash = cashAccount ? Number(cashAccount.currentBalance || 0) : 0;
    const physicalCash = Number(existing?.physicalCash || 0);
    const cashDifference = physicalCash - systemCash;

    const overview = {
      date: dateStr,
      revenue: {
        roomRevenue,
        restaurantRevenue,
        otherIncome,
        totalRevenue,
      },
      cash: {
        systemCash,
        physicalCash,
        cashDifference,
      },
      closing: existing ? existing.toJSON() : null,
    };

    res.json(overview);
  } catch (error) {
    console.error('DayClosing overview error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:hotelId/day-closing/close', getHotelContext, [
  body('date').isISO8601(),
  body('physicalCash').isFloat(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { DayClosing, CashBankAccount } = req.hotelModels;
    await DayClosing.sync();

    const dateStr = req.body.date;
    const cashAccount = await CashBankAccount.findOne({ where: { type: 'CASH', isActive: true } });
    const systemCash = cashAccount ? Number(cashAccount.currentBalance || 0) : 0;
    const physicalCash = Number(req.body.physicalCash || 0);
    const cashDifference = physicalCash - systemCash;
    const hasMismatch = cashDifference !== 0;

    const payload = {
      date: dateStr,
      totalRevenue: Number(req.body.totalRevenue || 0),
      roomRevenue: Number(req.body.roomRevenue || 0),
      restaurantRevenue: Number(req.body.restaurantRevenue || 0),
      otherIncome: Number(req.body.otherIncome || 0),
      systemCash,
      physicalCash,
      cashDifference,
      hasMismatch,
      shifts: req.body.shifts || null,
      status: hasMismatch ? 'PENDING_APPROVAL' : 'CLOSED',
      locked: !!req.body.locked,
      notes: req.body.notes || null,
    };

    const [closing, created] = await DayClosing.findOrCreate({
      where: { date: dateStr },
      defaults: payload,
    });

    if (!created) {
      await closing.update(payload);
    }

    res.status(200).json({ closing: closing.toJSON() });
  } catch (error) {
    console.error('DayClosing close error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:hotelId/day-closing/lock', getHotelContext, [
  body('date').isISO8601(),
], async (req, res) => {
  try {
    const { DayClosing } = req.hotelModels;
    await DayClosing.sync();
    const dateStr = req.body.date;
    const closing = await DayClosing.findOne({ where: { date: dateStr } });
    if (!closing) return res.status(404).json({ message: 'Day closing not found' });
    await closing.update({ locked: true });
    res.json({ closing: closing.toJSON() });
  } catch (error) {
    console.error('DayClosing lock error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:hotelId/cash-bank/reconciliation/mark', getHotelContext, [
  body('entryIds').isArray({ min: 1 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { CashBankEntry } = req.hotelModels;
    const ids = req.body.entryIds || [];
    const dateStr = req.body.statementDate || new Date().toISOString().slice(0, 10);
    await CashBankEntry.update(
      { reconciled: true, statementDate: dateStr },
      { where: { id: ids } },
    );
    res.json({ success: true });
  } catch (error) {
    console.error('CashBank mark reconciled error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== BOOKINGS ====================

/**
 * @route   GET /api/hotel-data/:hotelId/bookings
 * @desc    Get all bookings for a hotel
 * @access  Private
 */
router.get('/:hotelId/bookings', getHotelContext, async (req, res) => {
  try {
    const { Booking } = req.hotelModels;
    const bookings = await Booking.findAll({
      order: [['createdAt', 'DESC']],
    });
    res.json({ bookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/hotel-data/:hotelId/bookings
 * @desc    Create new booking
 * @access  Private
 */
router.post(
  '/:hotelId/bookings',
  getHotelContext,
  [
    body('bookingNumber').notEmpty(),
    body('guestId').notEmpty(),
    body('guestName').notEmpty(),
    body('roomId').notEmpty(),
    body('checkIn').isISO8601(),
    body('checkOut').isISO8601(),
    body('totalAmount').isNumeric(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { Booking } = req.hotelModels;
      const booking = await Booking.create(req.body);
      res.status(201).json({ booking });
    } catch (error) {
      console.error('Create booking error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// ==================== LOYALTY ====================

/**
 * Simple loyalty business rules:
 * - Earning: 1 point per 100 currency units spent (amount / 100, rounded down)
 * - Tiers:
 *   - Silver:   0   - 1,999 points
 *   - Gold:     2,000 - 4,999 points
 *   - Platinum: 5,000+ points
 * - Redemption:
 *   - Minimum redeemable: 100 points
 *   - Cannot redeem more than current balance
 */

const LOYALTY_MIN_REDEEM = 100;

function getLoyaltyTier(points) {
  const p = Number(points || 0);
  if (p >= 5000) return 'Platinum';
  if (p >= 2000) return 'Gold';
  return 'Silver';
}

/**
 * @route   GET /api/hotel-data/:hotelId/loyalty
 * @desc    Get loyalty summary for all guests in a hotel
 * @access  Private
 */
router.get('/:hotelId/loyalty', getHotelContext, async (req, res) => {
  try {
    const { Guest } = req.hotelModels;
    const guests = await Guest.findAll({ order: [['createdAt', 'DESC']] });
    const items = guests.map((g) => {
      const json = g.toJSON();
      return {
        id: String(json.id),
        firstName: json.firstName,
        lastName: json.lastName,
        email: json.email,
        loyaltyPoints: Number(json.loyaltyPoints || 0),
        loyaltyTier: json.loyaltyTier || getLoyaltyTier(json.loyaltyPoints || 0),
        loyaltyTotalStays: Number(json.loyaltyTotalStays || 0),
        loyaltyTotalSpent: Number(json.loyaltyTotalSpent || 0),
        loyaltyLastUpdated: json.loyaltyLastUpdated || json.updatedAt || json.createdAt,
      };
    });
    res.json({ members: items });
  } catch (error) {
    console.error('Get loyalty error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/hotel-data/:hotelId/loyalty/:guestId/add-points
 * @desc    Add loyalty points (optionally based on amount spent)
 * @access  Private
 */
router.post(
  '/:hotelId/loyalty/:guestId/add-points',
  getHotelContext,
  [
    body('points').optional().isInt({ min: 0 }).withMessage('Points must be a non-negative integer'),
    body('amountSpent')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Amount spent must be a non-negative number'),
    body('incrementStays')
      .optional()
      .isBoolean()
      .withMessage('incrementStays must be boolean'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { Guest } = req.hotelModels;
      const guest = await Guest.findByPk(req.params.guestId);
      if (!guest) {
        return res.status(404).json({ message: 'Guest not found' });
      }

      const currentPoints = Number(guest.loyaltyPoints || 0);
      const bodyPoints = req.body.points != null ? parseInt(req.body.points, 10) : null;
      const amount = req.body.amountSpent != null ? parseFloat(req.body.amountSpent) : null;

      if (bodyPoints == null && amount == null) {
        return res.status(400).json({
          message: 'Either points or amountSpent is required to add loyalty points',
        });
      }

      let earnedPoints = 0;
      if (typeof bodyPoints === 'number' && bodyPoints > 0) {
        earnedPoints += bodyPoints;
      }
      if (typeof amount === 'number' && amount > 0) {
        // Business rule: 1 point per 100 currency units spent
        earnedPoints += Math.floor(amount / 100);
      }

      if (earnedPoints <= 0) {
        return res.status(400).json({ message: 'No points to add (computed 0 points).' });
      }

      const newPoints = currentPoints + earnedPoints;
      const incrementStays = req.body.incrementStays === true;

      const updates = {
        loyaltyPoints: newPoints,
        loyaltyTier: getLoyaltyTier(newPoints),
        loyaltyLastUpdated: new Date(),
      };

      if (incrementStays) {
        updates.loyaltyTotalStays = Number(guest.loyaltyTotalStays || 0) + 1;
      }
      if (typeof amount === 'number' && amount > 0) {
        const currentSpent = Number(guest.loyaltyTotalSpent || 0);
        updates.loyaltyTotalSpent = currentSpent + amount;
      }

      await guest.update(updates);
      const refreshed = await Guest.findByPk(guest.id);
      res.json({ guest: refreshed.toJSON() });
    } catch (error) {
      console.error('Add loyalty points error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   POST /api/hotel-data/:hotelId/loyalty/:guestId/redeem
 * @desc    Redeem loyalty points
 * @access  Private
 */
router.post(
  '/:hotelId/loyalty/:guestId/redeem',
  getHotelContext,
  [body('points').isInt({ min: LOYALTY_MIN_REDEEM }).withMessage(`Minimum redeem is ${LOYALTY_MIN_REDEEM} points`)],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { Guest } = req.hotelModels;
      const guest = await Guest.findByPk(req.params.guestId);
      if (!guest) {
        return res.status(404).json({ message: 'Guest not found' });
      }

      const currentPoints = Number(guest.loyaltyPoints || 0);
      const redeemPoints = parseInt(req.body.points, 10);

      if (redeemPoints <= 0) {
        return res.status(400).json({ message: 'Redeem points must be positive.' });
      }
      if (redeemPoints > currentPoints) {
        return res.status(400).json({ message: 'Cannot redeem more points than available.' });
      }

      const newPoints = currentPoints - redeemPoints;
      const updates = {
        loyaltyPoints: newPoints,
        loyaltyTier: getLoyaltyTier(newPoints),
        loyaltyLastUpdated: new Date(),
      };

      await guest.update(updates);
      const refreshed = await Guest.findByPk(guest.id);
      res.json({ guest: refreshed.toJSON() });
    } catch (error) {
      console.error('Redeem loyalty points error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// ==================== FEEDBACK & COMPLAINTS ====================

/**
 * @route   GET /api/hotel-data/:hotelId/feedback
 * @desc    List feedback entries for a hotel
 * @access  Private
 */
router.get('/:hotelId/feedback', getHotelContext, async (req, res) => {
  try {
    const { Feedback } = req.hotelModels;
    const feedback = await Feedback.findAll({
      order: [['createdAt', 'DESC']],
    });
    res.json({ feedback });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/hotel-data/:hotelId/feedback
 * @desc    Submit guest feedback
 * @access  Private
 */
router.post(
  '/:hotelId/feedback',
  getHotelContext,
  [
    body('guestName').trim().notEmpty().withMessage('Guest name is required'),
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be an integer between 1 and 5'),
    body('comment').optional().isString().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { Feedback } = req.hotelModels;
      const payload = {
        guestName: String(req.body.guestName || '').trim(),
        rating: parseInt(req.body.rating, 10),
        comment: req.body.comment != null ? String(req.body.comment).trim() : null,
      };
      const entry = await Feedback.create(payload);
      res.status(201).json({ feedback: entry.toJSON() });
    } catch (error) {
      console.error('Create feedback error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   GET /api/hotel-data/:hotelId/complaints
 * @desc    List complaints for a hotel
 * @access  Private
 */
router.get('/:hotelId/complaints', getHotelContext, async (req, res) => {
  try {
    const { Complaint } = req.hotelModels;
    const complaints = await Complaint.findAll({
      order: [['createdAt', 'DESC']],
    });
    res.json({ complaints });
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/hotel-data/:hotelId/complaints
 * @desc    Register a new complaint (default status: Open)
 * @access  Private
 */
router.post(
  '/:hotelId/complaints',
  getHotelContext,
  [
    body('guestName').trim().notEmpty().withMessage('Guest name is required'),
    body('description').trim().notEmpty().withMessage('Complaint description is required'),
    body('assignedTo').optional().isString().trim(),
    body('resolutionNotes').optional().isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { Complaint } = req.hotelModels;
      const payload = {
        guestName: String(req.body.guestName || '').trim(),
        description: String(req.body.description || '').trim(),
        status: 'Open',
        assignedTo: req.body.assignedTo != null ? String(req.body.assignedTo).trim() : null,
        resolutionNotes:
          req.body.resolutionNotes != null ? String(req.body.resolutionNotes).trim() : null,
      };
      const complaint = await Complaint.create(payload);
      res.status(201).json({ complaint: complaint.toJSON() });
    } catch (error) {
      console.error('Create complaint error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   PUT /api/hotel-data/:hotelId/complaints/:id/assign
 * @desc    Assign complaint to staff
 * @access  Private
 */
router.put(
  '/:hotelId/complaints/:id/assign',
  getHotelContext,
  [body('assignedTo').trim().notEmpty().withMessage('Assigned staff name is required')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { Complaint } = req.hotelModels;
      const complaint = await Complaint.findByPk(req.params.id);
      if (!complaint) {
        return res.status(404).json({ message: 'Complaint not found' });
      }

      complaint.assignedTo = String(req.body.assignedTo || '').trim();
      await complaint.save();

      res.json({ complaint: complaint.toJSON() });
    } catch (error) {
      console.error('Assign complaint error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   PUT /api/hotel-data/:hotelId/complaints/:id/status
 * @desc    Update complaint status and resolution notes
 * @access  Private
 */
router.put(
  '/:hotelId/complaints/:id/status',
  getHotelContext,
  [
    body('status')
      .isIn(['Open', 'In Progress', 'Resolved'])
      .withMessage('Status must be Open, In Progress, or Resolved'),
    body('resolutionNotes').optional().isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { Complaint } = req.hotelModels;
      const complaint = await Complaint.findByPk(req.params.id);
      if (!complaint) {
        return res.status(404).json({ message: 'Complaint not found' });
      }

      complaint.status = req.body.status;
      if (req.body.resolutionNotes !== undefined) {
        complaint.resolutionNotes =
          req.body.resolutionNotes != null
            ? String(req.body.resolutionNotes).trim()
            : null;
      }

      await complaint.save();

      res.json({ complaint: complaint.toJSON() });
    } catch (error) {
      console.error('Update complaint status error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   GET /api/hotel-data/:hotelId/feedback/dashboard-stats
 * @desc    Get dashboard stats: average rating, total reviews, open complaints
 * @access  Private
 */
router.get('/:hotelId/feedback/dashboard-stats', getHotelContext, async (req, res) => {
  try {
    const { Feedback, Complaint } = req.hotelModels;

    const feedbackRows = await Feedback.findAll({
      attributes: ['rating'],
    });
    const totalReviews = feedbackRows.length;
    const totalRating = feedbackRows.reduce(
      (sum, row) => sum + Number(row.rating || 0),
      0
    );
    const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

    const openComplaints = await Complaint.count({
      where: { status: 'Open' },
    });

    res.json({
      averageRating,
      totalReviews,
      openComplaints,
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== ROOM INSPECTIONS ====================

/**
 * @route   GET /api/hotel-data/:hotelId/inspections
 * @desc    List room inspections for a hotel (optionally filtered by date)
 * @access  Private
 */
router.get('/:hotelId/inspections', getHotelContext, async (req, res) => {
  try {
    const { Inspection } = req.hotelModels;
    const where = {};
    if (req.query.date) {
      where.specificDate = req.query.date;
    }
    const inspections = await Inspection.findAll({
      where,
      order: [['scheduledDate', 'DESC'], ['roomNumber', 'ASC']],
    });
    res.json({ inspections });
  } catch (error) {
    console.error('Get inspections error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/hotel-data/:hotelId/inspections
 * @desc    Schedule a room inspection
 * @access  Private
 */
router.post(
  '/:hotelId/inspections',
  getHotelContext,
  [
    body('roomNumber').trim().notEmpty().withMessage('Room number is required'),
    body('inspector').trim().notEmpty().withMessage('Inspector name is required'),
    body('scheduledDate')
      .optional()
      .isISO8601()
      .withMessage('scheduledDate must be a valid date'),
    body('shift')
      .optional()
      .isIn(['Morning', 'Afternoon', 'Evening/Night', 'All day'])
      .withMessage('Invalid shift'),
    body('status')
      .optional()
      .isIn(['Pending', 'Completed', 'Issues Reported'])
      .withMessage('Invalid status'),
    body('issuesSummary').optional().isString(),
    body('issuesCount').optional().isInt({ min: 0 }),
    body('checklist').optional(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json({ message: 'Validation failed', errors: errors.array() });
      }

      const { Room, Inspection } = req.hotelModels;
      const rawRoomNumber = String(req.body.roomNumber || '').trim();
      let floor = null;
      let roomType = null;

      // Try to enrich with floor/roomType from Room table
      if (Room && rawRoomNumber) {
        const room = await Room.findOne({ where: { roomNumber: rawRoomNumber } }).catch(
          () => null,
        );
        if (room) {
          const r = room.toJSON();
          floor = r.floor != null ? Number(r.floor) : null;
          roomType = r.roomType || null;
        }
      }

      const today = new Date();
      const scheduledDate =
        req.body.scheduledDate ||
        today.toISOString().slice(0, 10); // YYYY-MM-DD

      const issuesSummary =
        req.body.issuesSummary != null
          ? String(req.body.issuesSummary).trim()
          : null;
      const issuesCount =
        typeof req.body.issuesCount === 'number'
          ? req.body.issuesCount
          : issuesSummary
          ? 1
          : 0;

      const status =
        ['Pending', 'Completed', 'Issues Reported'].includes(req.body.status) &&
        req.body.status
          ? req.body.status
          : issuesCount > 0
          ? 'Issues Reported'
          : 'Pending';

      const shift =
        ['Morning', 'Afternoon', 'Evening/Night', 'All day'].includes(req.body.shift) &&
        req.body.shift
          ? req.body.shift
          : 'All day';

      const checklist =
        req.body.checklist && typeof req.body.checklist === 'object'
          ? req.body.checklist
          : {
              cleanliness: 'Pending',
              maintenance: 'Pending',
              amenities: 'Pending',
              linen: 'Pending',
            };

      const payload = {
        roomNumber: rawRoomNumber,
        floor,
        roomType,
        inspector: String(req.body.inspector || '').trim(),
        scheduledDate,
        shift,
        status,
        issuesSummary,
        issuesCount,
        checklist,
        cleanedBy:
          req.body.cleanedBy != null ? String(req.body.cleanedBy).trim() : null,
      };

      const inspection = await Inspection.create(payload);
      res.status(201).json({ inspection: inspection.toJSON() });
    } catch (error) {
      console.error('Create inspection error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   PUT /api/hotel-data/:hotelId/inspections/:id
 * @desc    Update inspection (status, checklist, issues, etc.)
 * @access  Private
 */
router.put(
  '/:hotelId/inspections/:id',
  getHotelContext,
  [
    body('status')
      .optional()
      .isIn(['Pending', 'Completed', 'Issues Reported'])
      .withMessage('Invalid status'),
    body('issuesSummary').optional().isString(),
    body('issuesCount').optional().isInt({ min: 0 }),
    body('checklist').optional(),
    body('cleanedBy').optional().isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json({ message: 'Validation failed', errors: errors.array() });
      }

      const { Inspection } = req.hotelModels;
      const inspection = await Inspection.findByPk(req.params.id);
      if (!inspection) {
        return res.status(404).json({ message: 'Inspection not found' });
      }

      if (req.body.status != null) {
        inspection.status = req.body.status;
      }
      if (req.body.issuesSummary !== undefined) {
        inspection.issuesSummary =
          req.body.issuesSummary != null
            ? String(req.body.issuesSummary).trim()
            : null;
      }
      if (req.body.issuesCount !== undefined) {
        inspection.issuesCount = Number(req.body.issuesCount || 0);
      }
      if (req.body.checklist && typeof req.body.checklist === "object") {
        inspection.checklist = req.body.checklist;
      }
      if (req.body.cleanedBy !== undefined) {
        inspection.cleanedBy =
          req.body.cleanedBy != null ? String(req.body.cleanedBy).trim() : null;
      }

      await inspection.save();
      res.json({ inspection: inspection.toJSON() });
    } catch (error) {
      console.error('Update inspection error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// ==================== GUESTS ====================

/**
 * @route   GET /api/hotel-data/:hotelId/guests
 * @desc    Get all guests for a hotel
 * @access  Private
 */
router.get('/:hotelId/guests', getHotelContext, async (req, res) => {
  try {
    const { Guest } = req.hotelModels;
    try { await Guest.sync({ alter: true }); } catch (e) { console.warn('Guest sync:', e.message); }
    const guests = await Guest.findAll({
      order: [['createdAt', 'DESC']],
    });
    res.json({ guests });
  } catch (error) {
    console.error('Get guests error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/hotel-data/:hotelId/guests
 * @desc    Create new guest
 * @access  Private
 */
router.post(
  '/:hotelId/guests',
  getHotelContext,
  [
    body('firstName').notEmpty(),
    body('lastName').notEmpty(),
    body('email').isEmail(),
    body('phone').notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { Guest } = req.hotelModels;
      try { await Guest.sync({ alter: true }); } catch (e) { console.warn('Guest sync:', e.message); }
      const payload = {
        firstName: String(req.body.firstName || '').trim(),
        lastName: String(req.body.lastName || '').trim(),
        email: String(req.body.email || '').trim().toLowerCase(),
        phone: String(req.body.phone || '').trim(),
      };
      if (req.body.address != null && typeof req.body.address === 'object') {
        payload.address = req.body.address;
      } else if (req.body.address != null && typeof req.body.address === 'string') {
        payload.address = { line: req.body.address };
      }
      if (req.body.dateOfBirth) payload.dateOfBirth = req.body.dateOfBirth;
      if (['passport', 'driving_license', 'national_id', 'other'].includes(req.body.idType)) {
        payload.idType = req.body.idType;
      }
      if (req.body.idNumber != null && String(req.body.idNumber).trim()) {
        payload.idNumber = String(req.body.idNumber).trim();
      }
      if (req.body.preferences != null && typeof req.body.preferences === 'object') {
        payload.preferences = req.body.preferences;
      }
      if (typeof req.body.loyaltyPoints === 'number' && req.body.loyaltyPoints >= 0) {
        payload.loyaltyPoints = req.body.loyaltyPoints;
      }
      const guest = await Guest.create(payload);
      res.status(201).json({ guest });
    } catch (error) {
      console.error('Create guest error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   GET /api/hotel-data/:hotelId/guests/:guestId
 * @desc    Get one guest by id
 * @access  Private
 */
router.get('/:hotelId/guests/:guestId', getHotelContext, async (req, res) => {
  try {
    const { Guest } = req.hotelModels;
    const guest = await Guest.findByPk(req.params.guestId);
    if (!guest) {
      return res.status(404).json({ message: 'Guest not found' });
    }
    res.json({ guest: guest.toJSON() });
  } catch (error) {
    console.error('Get guest error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   PUT /api/hotel-data/:hotelId/guests/:guestId
 * @desc    Update guest
 * @access  Private
 */
router.put(
  '/:hotelId/guests/:guestId',
  getHotelContext,
  [
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('email').optional().isEmail(),
    body('phone').optional().trim().notEmpty(),
    body('address').optional(),
    body('dateOfBirth').optional(),
    body('idType').optional().isIn(['passport', 'driving_license', 'national_id', 'other']),
    body('idNumber').optional().trim(),
    body('preferences').optional(),
    body('loyaltyPoints').optional().isInt({ min: 0 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }
      const { Guest } = req.hotelModels;
      const guest = await Guest.findByPk(req.params.guestId);
      if (!guest) {
        return res.status(404).json({ message: 'Guest not found' });
      }
      const updates = {};
      if (req.body.firstName != null) updates.firstName = String(req.body.firstName).trim();
      if (req.body.lastName != null) updates.lastName = String(req.body.lastName).trim();
      if (req.body.email != null) updates.email = String(req.body.email).trim().toLowerCase();
      if (req.body.phone != null) updates.phone = String(req.body.phone).trim();
      if (req.body.address !== undefined) {
        updates.address = typeof req.body.address === 'string' ? { line: req.body.address } : req.body.address;
      }
      if (req.body.dateOfBirth !== undefined) updates.dateOfBirth = req.body.dateOfBirth || null;
      if (req.body.idType !== undefined) updates.idType = req.body.idType || null;
      if (req.body.idNumber !== undefined) updates.idNumber = req.body.idNumber ? String(req.body.idNumber).trim() : null;
      if (req.body.preferences !== undefined && typeof req.body.preferences === 'object') {
        updates.preferences = { ...(guest.preferences || {}), ...req.body.preferences };
      }
      if (req.body.loyaltyPoints !== undefined && typeof req.body.loyaltyPoints === 'number') {
        updates.loyaltyPoints = req.body.loyaltyPoints;
      }
      await guest.update(updates);
      res.json({ guest: (await Guest.findByPk(guest.id)).toJSON() });
    } catch (error) {
      console.error('Update guest error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   DELETE /api/hotel-data/:hotelId/guests/:guestId
 * @desc    Delete guest
 * @access  Private
 */
router.delete('/:hotelId/guests/:guestId', getHotelContext, async (req, res) => {
  try {
    const { Guest } = req.hotelModels;
    const guest = await Guest.findByPk(req.params.guestId);
    if (!guest) {
      return res.status(404).json({ message: 'Guest not found' });
    }
    await guest.destroy();
    res.json({ message: 'Guest deleted successfully' });
  } catch (error) {
    console.error('Delete guest error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== ROOMS & PROPERTY ====================

/**
 * @route   GET /api/hotel-data/:hotelId/floors
 * @desc    Get floor-wise summary (total, occupied, available, maintenance per floor)
 * @access  Private
 */
router.get('/:hotelId/floors', getHotelContext, async (req, res) => {
  try {
    const { Room } = req.hotelModels;
    const rooms = await Room.findAll({
      attributes: ['floor', 'status'],
      order: [['floor', 'ASC']],
    }).catch(() => []);

    const byFloor = {};
    rooms.forEach((r) => {
      const f = r.floor != null ? Number(r.floor) : 0;
      if (!byFloor[f]) {
        byFloor[f] = { floor: f, totalRooms: 0, occupied: 0, available: 0, maintenance: 0, cleaning: 0 };
      }
      byFloor[f].totalRooms += 1;
      const s = (r.status || 'available').toLowerCase();
      if (s === 'occupied') byFloor[f].occupied += 1;
      else if (s === 'maintenance') byFloor[f].maintenance += 1;
      else if (s === 'cleaning') byFloor[f].cleaning += 1;
      else byFloor[f].available += 1;
    });

    const floorLabels = { 0: 'Ground Floor', 1: '1st Floor', 2: '2nd Floor', 3: '3rd Floor' };
    const floors = Object.keys(byFloor)
      .map(Number)
      .sort((a, b) => a - b)
      .map((f) => ({
        id: f,
        floor: floorLabels[f] || `${f}th Floor`,
        floorNumber: f,
        totalRooms: byFloor[f].totalRooms,
        occupied: byFloor[f].occupied,
        available: byFloor[f].available,
        maintenance: byFloor[f].maintenance,
        cleaning: byFloor[f].cleaning,
      }));

    if (floors.length === 0) {
      floors.push(
        { id: 0, floor: 'Ground Floor', floorNumber: 0, totalRooms: 0, occupied: 0, available: 0, maintenance: 0, cleaning: 0 },
        { id: 1, floor: '1st Floor', floorNumber: 1, totalRooms: 0, occupied: 0, available: 0, maintenance: 0, cleaning: 0 }
      );
    }
    res.json({ floors });
  } catch (error) {
    console.error('Get floors error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== HOUSEKEEPING ASSIGNMENTS ====================

/**
 * @route   GET /api/hotel-data/:hotelId/housekeeping-assignments
 * @desc    List housekeeping tasks for a hotel
 * @access  Private
 */
router.get('/:hotelId/housekeeping-assignments', getHotelContext, async (req, res) => {
  try {
    const { HousekeepingTask } = req.hotelModels;
    const assignments = await HousekeepingTask.findAll({
      order: [['createdAt', 'DESC']],
    });
    res.json({ assignments });
  } catch (error) {
    console.error('Get housekeeping assignments error:', error);
    res.status(500).json({ message: 'Failed to load housekeeping assignments', error: error.message });
  }
});

/**
 * @route   POST /api/hotel-data/:hotelId/housekeeping-assignments
 * @desc    Create a housekeeping task
 * @access  Private
 */
router.post(
  '/:hotelId/housekeeping-assignments',
  getHotelContext,
  [
    body('roomNumber').trim().notEmpty().withMessage('Room number is required'),
    body('housekeeper').trim().notEmpty().withMessage('Housekeeper is required'),
    body('cleaningType').trim().notEmpty().withMessage('Cleaning type is required'),
    body('schedule').optional({ nullable: true }).isString(),
    body('status').optional().isIn(['Pending', 'In Progress', 'Completed']),
    body('notes').optional({ nullable: true }).isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { HousekeepingTask, Room } = req.hotelModels;
      const payload = {
        roomNumber: String(req.body.roomNumber || '').trim(),
        housekeeper: String(req.body.housekeeper || '').trim(),
        cleaningType: String(req.body.cleaningType || '').trim(),
        schedule: req.body.schedule != null ? String(req.body.schedule) : null,
        status: ['Pending', 'In Progress', 'Completed'].includes(req.body.status) ? req.body.status : 'Pending',
        notes: req.body.notes != null ? String(req.body.notes) : null,
      };

      const assignment = await HousekeepingTask.create(payload);

      // If a task is created as Completed, mark the room as available (ready/vacant)
      if (payload.status === 'Completed' && payload.roomNumber) {
        await Room.update(
          { status: 'available' },
          { where: { roomNumber: payload.roomNumber } }
        ).catch(() => {});
      }

      res.status(201).json({ assignment });
    } catch (error) {
      console.error('Create housekeeping assignment error:', error);
      res.status(500).json({ message: 'Failed to create housekeeping assignment', error: error.message });
    }
  }
);

/**
 * @route   PUT /api/hotel-data/:hotelId/housekeeping-assignments/:id
 * @desc    Update housekeeping task (e.g., status)
 * @access  Private
 */
router.put(
  '/:hotelId/housekeeping-assignments/:id',
  getHotelContext,
  [
    body('roomNumber').optional().trim().notEmpty(),
    body('housekeeper').optional().trim().notEmpty(),
    body('cleaningType').optional().trim().notEmpty(),
    body('schedule').optional({ nullable: true }).isString(),
    body('status').optional().isIn(['Pending', 'In Progress', 'Completed']),
    body('notes').optional({ nullable: true }).isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { HousekeepingTask, Room } = req.hotelModels;
      const task = await HousekeepingTask.findByPk(req.params.id);
      if (!task) return res.status(404).json({ message: 'Assignment not found' });

      ['roomNumber', 'housekeeper', 'cleaningType', 'schedule', 'status', 'notes'].forEach((key) => {
        if (req.body[key] !== undefined) task[key] = req.body[key];
      });
      await task.save();

      if (String(task.status) === 'Completed' && task.roomNumber) {
        await Room.update({ status: 'available' }, { where: { roomNumber: task.roomNumber } }).catch(() => {});
      }

      res.json({ assignment: task });
    } catch (error) {
      console.error('Update housekeeping assignment error:', error);
      res.status(500).json({ message: 'Failed to update housekeeping assignment', error: error.message });
    }
  }
);

// ==================== LAUNDRY TASKS ====================

/**
 * @route   GET /api/hotel-data/:hotelId/laundry-tasks
 * @desc    List laundry tasks for a hotel (optionally filtered by date or status)
 * @access  Private
 */
router.get('/:hotelId/laundry-tasks', getHotelContext, async (req, res) => {
  try {
    const { LaundryTask } = req.hotelModels;
    const where = {};
    if (req.query.date) {
      where.scheduledDate = req.query.date;
    }
    if (req.query.status) {
      where.status = req.query.status;
    }
    const tasks = await LaundryTask.findAll({
      where,
      order: [['scheduledDate', 'DESC'], ['createdAt', 'DESC']],
    });
    res.json({ tasks });
  } catch (error) {
    console.error('Get laundry tasks error:', error);
    res.status(500).json({ message: 'Failed to load laundry tasks', error: error.message });
  }
});

/**
 * @route   POST /api/hotel-data/:hotelId/laundry-tasks
 * @desc    Create a laundry task
 * @access  Private
 */
router.post(
  '/:hotelId/laundry-tasks',
  getHotelContext,
  [
    body('loadNumber').trim().notEmpty().withMessage('Load number is required'),
    body('itemType').trim().notEmpty().withMessage('Item type is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    body('scheduledDate').optional().isISO8601().withMessage('Invalid date format'),
    body('assignedTo').optional().isString(),
    body('assignedType').optional().isIn(['Staff', 'Vendor']),
    body('status').optional().isIn(['Pending', 'Washing', 'Drying', 'Ironing', 'Folding', 'Completed']),
    body('cycleType').optional().isString(),
    body('notes').optional({ nullable: true }).isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { LaundryTask } = req.hotelModels;
      const today = new Date();
      const scheduledDate = req.body.scheduledDate || today.toISOString().slice(0, 10);

      const payload = {
        loadNumber: String(req.body.loadNumber || '').trim(),
        itemType: String(req.body.itemType || '').trim(),
        quantity: Number(req.body.quantity || 0),
        scheduledDate,
        assignedTo: req.body.assignedTo != null ? String(req.body.assignedTo).trim() : null,
        assignedType: ['Staff', 'Vendor'].includes(req.body.assignedType) ? req.body.assignedType : 'Staff',
        status: ['Pending', 'Washing', 'Drying', 'Ironing', 'Folding', 'Completed'].includes(req.body.status) 
          ? req.body.status 
          : 'Pending',
        cycleType: req.body.cycleType != null ? String(req.body.cycleType).trim() : 'Daily',
        notes: req.body.notes != null ? String(req.body.notes).trim() : null,
      };

      const task = await LaundryTask.create(payload);
      res.status(201).json({ task: task.toJSON() });
    } catch (error) {
      console.error('Create laundry task error:', error);
      res.status(500).json({ message: 'Failed to create laundry task', error: error.message });
    }
  }
);

/**
 * @route   PUT /api/hotel-data/:hotelId/laundry-tasks/:id
 * @desc    Update laundry task (status, assignment, etc.)
 * @access  Private
 */
router.put(
  '/:hotelId/laundry-tasks/:id',
  getHotelContext,
  [
    body('status').optional().isIn(['Pending', 'Washing', 'Drying', 'Ironing', 'Folding', 'Completed']),
    body('assignedTo').optional().isString(),
    body('assignedType').optional().isIn(['Staff', 'Vendor']),
    body('quantity').optional().isInt({ min: 1 }),
    body('notes').optional({ nullable: true }).isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { LaundryTask } = req.hotelModels;
      const task = await LaundryTask.findByPk(req.params.id);
      if (!task) {
        return res.status(404).json({ message: 'Laundry task not found' });
      }

      if (req.body.status != null) {
        task.status = req.body.status;
        if (req.body.status === 'Completed') {
          task.completedAt = new Date();
        }
      }
      if (req.body.assignedTo !== undefined) {
        task.assignedTo = req.body.assignedTo != null ? String(req.body.assignedTo).trim() : null;
      }
      if (req.body.assignedType !== undefined) {
        task.assignedType = ['Staff', 'Vendor'].includes(req.body.assignedType) ? req.body.assignedType : 'Staff';
      }
      if (req.body.quantity !== undefined) {
        task.quantity = Number(req.body.quantity);
      }
      if (req.body.notes !== undefined) {
        task.notes = req.body.notes != null ? String(req.body.notes).trim() : null;
      }

      await task.save();
      res.json({ task: task.toJSON() });
    } catch (error) {
      console.error('Update laundry task error:', error);
      res.status(500).json({ message: 'Failed to update laundry task', error: error.message });
    }
  }
);

// ==================== LINEN INVENTORY ====================

/**
 * @route   GET /api/hotel-data/:hotelId/linen-items
 * @desc    List all linen items (stock management)
 * @access  Private
 */
router.get('/:hotelId/linen-items', getHotelContext, async (req, res) => {
  try {
    const { LinenItem } = req.hotelModels;
    const items = await LinenItem.findAll({
      order: [['category', 'ASC'], ['itemName', 'ASC']],
    });
    res.json({ items });
  } catch (error) {
    console.error('Get linen items error:', error);
    res.status(500).json({ message: 'Failed to load linen items', error: error.message });
  }
});

/**
 * @route   POST /api/hotel-data/:hotelId/linen-items
 * @desc    Create or update linen item
 * @access  Private
 */
router.post(
  '/:hotelId/linen-items',
  getHotelContext,
  [
    body('itemName').trim().notEmpty().withMessage('Item name is required'),
    body('category').optional({ nullable: true }).isString().withMessage('Category must be a string'),
    body('currentStock').optional({ nullable: true }).custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      const num = Number(value);
      return !isNaN(num) && num >= 0 && Number.isInteger(num);
    }).withMessage('Current stock must be a non-negative integer'),
    body('minimumThreshold').optional({ nullable: true }).custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      const num = Number(value);
      return !isNaN(num) && num >= 0 && Number.isInteger(num);
    }).withMessage('Minimum threshold must be a non-negative integer'),
    body('maximumCapacity').optional({ nullable: true }).custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      const num = Number(value);
      return !isNaN(num) && num >= 0 && Number.isInteger(num);
    }).withMessage('Maximum capacity must be a non-negative integer'),
    body('unit').optional({ nullable: true }).isString().withMessage('Unit must be a string'),
    body('location').optional({ nullable: true }).isString().withMessage('Location must be a string'),
    body('notes').optional({ nullable: true }).isString().withMessage('Notes must be a string'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error('Linen item validation errors:', errors.array());
        console.error('Request body:', JSON.stringify(req.body, null, 2));
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { LinenItem } = req.hotelModels;
      const itemName = String(req.body.itemName || '').trim();

      // Check if item exists
      const existing = await LinenItem.findOne({ where: { itemName } });
      
      if (existing) {
        // Update existing
        ['category', 'currentStock', 'minimumThreshold', 'maximumCapacity', 'unit', 'location', 'notes'].forEach((key) => {
          if (req.body[key] !== undefined) {
            if (key === 'currentStock' || key === 'minimumThreshold' || key === 'maximumCapacity') {
              existing[key] = Number(req.body[key]);
            } else {
              existing[key] = req.body[key] != null ? String(req.body[key]).trim() : null;
            }
          }
        });
        await existing.save();
        res.json({ item: existing.toJSON() });
      } else {
        // Create new
        const payload = {
          itemName,
          category: req.body.category ? String(req.body.category).trim() : 'Bedding',
          currentStock: Number(req.body.currentStock || 0),
          minimumThreshold: Number(req.body.minimumThreshold || 50),
          maximumCapacity: req.body.maximumCapacity != null ? Number(req.body.maximumCapacity) : null,
          unit: req.body.unit ? String(req.body.unit).trim() : 'pieces',
          location: req.body.location != null ? String(req.body.location).trim() : null,
          notes: req.body.notes != null ? String(req.body.notes).trim() : null,
        };
        const item = await LinenItem.create(payload);
        res.status(201).json({ item: item.toJSON() });
      }
    } catch (error) {
      console.error('Create/update linen item error:', error);
      res.status(500).json({ message: 'Failed to save linen item', error: error.message });
    }
  }
);

/**
 * @route   PUT /api/hotel-data/:hotelId/linen-items/:id
 * @desc    Update linen item stock or details
 * @access  Private
 */
router.put(
  '/:hotelId/linen-items/:id',
  getHotelContext,
  [
    body('currentStock').optional().isInt({ min: 0 }),
    body('minimumThreshold').optional().isInt({ min: 0 }),
    body('maximumCapacity').optional().isInt({ min: 0 }),
    body('category').optional().isString(),
    body('location').optional().isString(),
    body('notes').optional({ nullable: true }).isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { LinenItem } = req.hotelModels;
      const item = await LinenItem.findByPk(req.params.id);
      if (!item) {
        return res.status(404).json({ message: 'Linen item not found' });
      }

      ['currentStock', 'minimumThreshold', 'maximumCapacity', 'category', 'location', 'notes'].forEach((key) => {
        if (req.body[key] !== undefined) {
          if (['currentStock', 'minimumThreshold', 'maximumCapacity'].includes(key)) {
            item[key] = Number(req.body[key]);
          } else {
            item[key] = req.body[key] != null ? String(req.body[key]).trim() : null;
          }
        }
      });

      await item.save();
      res.json({ item: item.toJSON() });
    } catch (error) {
      console.error('Update linen item error:', error);
      res.status(500).json({ message: 'Failed to update linen item', error: error.message });
    }
  }
);

/**
 * @route   GET /api/hotel-data/:hotelId/linen-usage
 * @desc    List linen usage records (issued to rooms/staff)
 * @access  Private
 */
router.get('/:hotelId/linen-usage', getHotelContext, async (req, res) => {
  try {
    const { LinenUsage } = req.hotelModels;
    const where = {};
    if (req.query.itemId) {
      where.linenItemId = req.query.itemId;
    }
    if (req.query.issuedTo) {
      where.issuedTo = req.query.issuedTo;
    }
    if (req.query.condition) {
      where.condition = req.query.condition;
    }
    const usage = await LinenUsage.findAll({
      where,
      order: [['issuedDate', 'DESC']],
    });
    res.json({ usage });
  } catch (error) {
    console.error('Get linen usage error:', error);
    res.status(500).json({ message: 'Failed to load linen usage', error: error.message });
  }
});

/**
 * @route   POST /api/hotel-data/:hotelId/linen-usage
 * @desc    Record linen issued to room or staff
 * @access  Private
 */
router.post(
  '/:hotelId/linen-usage',
  getHotelContext,
  [
    body('linenItemId').trim().notEmpty().withMessage('Linen item ID is required'),
    body('itemName').trim().notEmpty().withMessage('Item name is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('issuedTo').trim().notEmpty().withMessage('Issued to (room/staff) is required'),
    body('issuedType').optional().isIn(['Room', 'Staff']),
    body('condition').optional().isIn(['New', 'Good', 'Worn', 'Damaged']),
    body('notes').optional({ nullable: true }).isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { LinenItem, LinenUsage } = req.hotelModels;
      
      // Verify item exists and has enough stock
      const item = await LinenItem.findByPk(req.body.linenItemId);
      if (!item) {
        return res.status(404).json({ message: 'Linen item not found' });
      }

      const quantity = Number(req.body.quantity);
      if (item.currentStock < quantity) {
        return res.status(400).json({ message: 'Insufficient stock available' });
      }

      // Create usage record
      const payload = {
        linenItemId: String(req.body.linenItemId),
        itemName: String(req.body.itemName).trim(),
        quantity,
        issuedTo: String(req.body.issuedTo).trim(),
        issuedType: ['Room', 'Staff'].includes(req.body.issuedType) ? req.body.issuedType : 'Room',
        condition: ['New', 'Good', 'Worn', 'Damaged'].includes(req.body.condition) ? req.body.condition : 'Good',
        issuedDate: req.body.issuedDate || new Date().toISOString().slice(0, 10),
        notes: req.body.notes != null ? String(req.body.notes).trim() : null,
      };

      const usage = await LinenUsage.create(payload);

      // Deduct from stock
      item.currentStock -= quantity;
      await item.save();

      res.status(201).json({ usage: usage.toJSON() });
    } catch (error) {
      console.error('Create linen usage error:', error);
      res.status(500).json({ message: 'Failed to record linen usage', error: error.message });
    }
  }
);

/**
 * @route   PUT /api/hotel-data/:hotelId/linen-usage/:id
 * @desc    Update linen usage (e.g., return, condition change)
 * @access  Private
 */
router.put(
  '/:hotelId/linen-usage/:id',
  getHotelContext,
  [
    body('returnedDate').optional().isISO8601(),
    body('returnedCondition').optional().isIn(['New', 'Good', 'Worn', 'Damaged']),
    body('condition').optional().isIn(['New', 'Good', 'Worn', 'Damaged']),
    body('notes').optional({ nullable: true }).isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { LinenUsage, LinenItem } = req.hotelModels;
      const usage = await LinenUsage.findByPk(req.params.id);
      if (!usage) {
        return res.status(404).json({ message: 'Usage record not found' });
      }

      if (req.body.returnedDate !== undefined) {
        usage.returnedDate = req.body.returnedDate || null;
      }
      if (req.body.returnedCondition !== undefined) {
        usage.returnedCondition = ['New', 'Good', 'Worn', 'Damaged'].includes(req.body.returnedCondition) 
          ? req.body.returnedCondition 
          : null;
      }
      if (req.body.condition !== undefined) {
        usage.condition = ['New', 'Good', 'Worn', 'Damaged'].includes(req.body.condition) 
          ? req.body.condition 
          : usage.condition;
      }
      if (req.body.notes !== undefined) {
        usage.notes = req.body.notes != null ? String(req.body.notes).trim() : null;
      }

      // If returning, add back to stock
      if (req.body.returnedDate && !usage.returnedDate) {
        const item = await LinenItem.findByPk(usage.linenItemId).catch(() => null);
        if (item) {
          item.currentStock += usage.quantity;
          await item.save();
        }
      }

      await usage.save();
      res.json({ usage: usage.toJSON() });
    } catch (error) {
      console.error('Update linen usage error:', error);
      res.status(500).json({ message: 'Failed to update linen usage', error: error.message });
    }
  }
);

// ==================== MAINTENANCE REQUESTS ====================

/**
 * @route   GET /api/hotel-data/:hotelId/maintenance-requests
 * @desc    List maintenance requests for a hotel
 * @access  Private
 */
router.get('/:hotelId/maintenance-requests', getHotelContext, async (req, res) => {
  try {
    const { MaintenanceRequest } = req.hotelModels;
    const requests = await MaintenanceRequest.findAll({
      order: [['createdAt', 'DESC']],
    });
    res.json({ requests });
  } catch (error) {
    console.error('Get maintenance requests error:', error);
    res.status(500).json({ message: 'Failed to load maintenance requests', error: error.message });
  }
});

/**
 * @route   POST /api/hotel-data/:hotelId/maintenance-requests
 * @desc    Create maintenance request
 * @access  Private
 */
router.post(
  '/:hotelId/maintenance-requests',
  getHotelContext,
  [
    body('roomNumber').trim().notEmpty().withMessage('Room number is required'),
    body('issue').trim().notEmpty().withMessage('Issue description is required'),
    body('priority').optional().isIn(['Low', 'Medium', 'High']),
    body('status').optional().isIn(['Pending', 'In Progress', 'Resolved']),
    body('notes').optional({ nullable: true }).isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { MaintenanceRequest, Room } = req.hotelModels;
      const payload = {
        roomNumber: String(req.body.roomNumber || '').trim(),
        issue: String(req.body.issue || '').trim(),
        priority: ['Low', 'Medium', 'High'].includes(req.body.priority) ? req.body.priority : 'Medium',
        status: ['Pending', 'In Progress', 'Resolved'].includes(req.body.status) ? req.body.status : 'Pending',
        notes: req.body.notes != null ? String(req.body.notes) : null,
      };

      const request = await MaintenanceRequest.create(payload);

      // If status indicates active maintenance, mark room as maintenance; if resolved, mark as available
      if (payload.roomNumber) {
        if (payload.status === 'Resolved') {
          await Room.update({ status: 'available' }, { where: { roomNumber: payload.roomNumber } }).catch(() => {});
        } else {
          await Room.update({ status: 'maintenance' }, { where: { roomNumber: payload.roomNumber } }).catch(() => {});
        }
      }

      res.status(201).json({ request });
    } catch (error) {
      console.error('Create maintenance request error:', error);
      res.status(500).json({ message: 'Failed to create maintenance request', error: error.message });
    }
  }
);

/**
 * @route   PUT /api/hotel-data/:hotelId/maintenance-requests/:id
 * @desc    Update maintenance request
 * @access  Private
 */
router.put(
  '/:hotelId/maintenance-requests/:id',
  getHotelContext,
  [
    body('roomNumber').optional().trim().notEmpty(),
    body('issue').optional().trim().notEmpty(),
    body('priority').optional().isIn(['Low', 'Medium', 'High']),
    body('status').optional().isIn(['Pending', 'In Progress', 'Resolved']),
    body('notes').optional({ nullable: true }).isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { MaintenanceRequest, Room } = req.hotelModels;
      const request = await MaintenanceRequest.findByPk(req.params.id);
      if (!request) return res.status(404).json({ message: 'Request not found' });

      ['roomNumber', 'issue', 'priority', 'status', 'notes'].forEach((key) => {
        if (req.body[key] !== undefined) request[key] = req.body[key];
      });
      await request.save();

      if (request.roomNumber) {
        if (String(request.status) === 'Resolved') {
          await Room.update({ status: 'available' }, { where: { roomNumber: request.roomNumber } }).catch(() => {});
        } else {
          await Room.update({ status: 'maintenance' }, { where: { roomNumber: request.roomNumber } }).catch(() => {});
        }
      }

      res.json({ request });
    } catch (error) {
      console.error('Update maintenance request error:', error);
      res.status(500).json({ message: 'Failed to update maintenance request', error: error.message });
    }
  }
);

/**
 * @route   GET /api/hotel-data/:hotelId/floors/:floorNumber/rooms
 * @desc    Get rooms on a specific floor
 * @access  Private
 */
router.get('/:hotelId/floors/:floorNumber/rooms', getHotelContext, async (req, res) => {
  try {
    const floorNum = parseInt(req.params.floorNumber, 10);
    if (Number.isNaN(floorNum) || floorNum < 0) {
      return res.status(400).json({ message: 'Invalid floor number' });
    }
    const { Room } = req.hotelModels;
    const rooms = await Room.findAll({
      where: { floor: floorNum },
      order: [['roomNumber', 'ASC']],
    }).catch(() => []);
    res.json({ rooms: rooms.map((r) => r.toJSON ? r.toJSON() : r) });
  } catch (error) {
    console.error('Get floor rooms error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/hotel-data/:hotelId/room-types
 * @desc    Get room types with counts and pricing (feature summary)
 * @access  Private
 */
router.get('/:hotelId/room-types', getHotelContext, async (req, res) => {
  try {
    const { Room } = req.hotelModels;
    const rooms = await Room.findAll({
      attributes: ['roomType', 'pricePerNight', 'capacity'],
      order: [['roomType', 'ASC']],
    }).catch(() => []);

    const byType = {};
    rooms.forEach((r) => {
      const t = r.roomType || 'double';
      if (!byType[t]) {
        byType[t] = { type: t, count: 0, price: r.pricePerNight, capacity: r.capacity || 2 };
      }
      byType[t].count += 1;
    });

    const typeLabels = {
      single: 'Single',
      double: 'Double',
      twin: 'Twin',
      suite: 'Suite',
      deluxe: 'Deluxe',
      presidential: 'Presidential',
    };
    const roomTypes = Object.entries(byType).map(([type, v]) => ({
      id: type,
      name: typeLabels[type] || type,
      capacity: v.capacity,
      price: v.price != null ? `$${Number(v.price).toFixed(0)}` : '$0',
      rooms: v.count,
    }));

    if (roomTypes.length === 0) {
      roomTypes.push(
        { id: 'single', name: 'Single', capacity: 1, price: '$80', rooms: 0 },
        { id: 'double', name: 'Double', capacity: 2, price: '$120', rooms: 0 },
        { id: 'suite', name: 'Suite', capacity: 4, price: '$200', rooms: 0 }
      );
    }
    res.json({ roomTypes });
  } catch (error) {
    console.error('Get room types error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== ROOM TYPE DEFINITIONS (list with descriptions) ====================

/**
 * @route   GET /api/hotel-data/:hotelId/room-type-definitions
 * @desc    List room type definitions; seed default 16 types if none exist
 * @access  Private
 */
router.get('/:hotelId/room-type-definitions', getHotelContext, async (req, res) => {
  try {
    let definitions = await RoomTypeDefinition.findAll({
      where: { hotelId: req.params.hotelId },
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
      raw: true,
    });
    if (definitions.length === 0) {
      await RoomTypeDefinition.bulkCreate(
        DEFAULT_ROOM_TYPES.map((t) => ({
          hotelId: req.params.hotelId,
          name: t.name,
          description: t.description,
          defaultCapacity: t.defaultCapacity,
          defaultPricePerNight: 0,
          sortOrder: t.sortOrder,
        }))
      );
      definitions = await RoomTypeDefinition.findAll({
        where: { hotelId: req.params.hotelId },
        order: [['sortOrder', 'ASC'], ['name', 'ASC']],
        raw: true,
      });
    }
    const { Room } = req.hotelModels;
    const rooms = await Room.findAll({ attributes: ['roomType'], raw: true }).catch(() => []);
    const countByType = rooms.reduce((acc, r) => {
      const t = (r.roomType || '').trim();
      if (t) acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {});
    const list = definitions.map((d) => ({
      id: d.id,
      hotelId: d.hotelId,
      name: d.name,
      description: d.description,
      defaultCapacity: d.defaultCapacity ?? d.default_capacity,
      defaultPricePerNight: d.defaultPricePerNight ?? d.default_price_per_night,
      sortOrder: d.sortOrder ?? d.sort_order,
      roomCount: countByType[d.name] || 0,
    }));
    res.json({ definitions: list });
  } catch (error) {
    console.error('Get room type definitions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/hotel-data/:hotelId/room-type-definitions/:id
 */
router.get('/:hotelId/room-type-definitions/:id', getHotelContext, async (req, res) => {
  try {
    const def = await RoomTypeDefinition.findOne({
      where: { id: req.params.id, hotelId: req.params.hotelId },
    });
    if (!def) return res.status(404).json({ message: 'Room type not found' });
    res.json({ definition: def.get ? def.get({ plain: true }) : def });
  } catch (error) {
    console.error('Get room type definition error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   PUT /api/hotel-data/:hotelId/room-type-definitions/:id
 */
router.put(
  '/:hotelId/room-type-definitions/:id',
  getHotelContext,
  [
    body('name').optional().trim().notEmpty(),
    body('description').optional().isString(),
    body('defaultCapacity').optional().toInt().isInt({ min: 1 }),
    body('defaultPricePerNight').optional().toFloat().isFloat({ min: 0 }),
    body('sortOrder').optional().toInt(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }
      const def = await RoomTypeDefinition.findOne({
        where: { id: req.params.id, hotelId: req.params.hotelId },
      });
      if (!def) return res.status(404).json({ message: 'Room type not found' });
      ['name', 'description', 'defaultCapacity', 'defaultPricePerNight', 'sortOrder'].forEach((key) => {
        if (req.body[key] !== undefined) {
          if (['defaultCapacity', 'sortOrder'].includes(key)) def[key] = Number(req.body[key]);
          else if (key === 'defaultPricePerNight') def[key] = Number(req.body[key]);
          else def[key] = req.body[key];
        }
      });
      await def.save();
      res.json({ definition: def.get ? def.get({ plain: true }) : def });
    } catch (error) {
      console.error('Update room type definition error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   DELETE /api/hotel-data/:hotelId/room-type-definitions/:id
 */
router.delete('/:hotelId/room-type-definitions/:id', getHotelContext, async (req, res) => {
  try {
    const def = await RoomTypeDefinition.findOne({
      where: { id: req.params.id, hotelId: req.params.hotelId },
    });
    if (!def) return res.status(404).json({ message: 'Room type not found' });
    await def.destroy();
    res.json({ message: 'Room type deleted' });
  } catch (error) {
    console.error('Delete room type definition error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/hotel-data/:hotelId/amenities
 * @desc    Get amenities as features (categories) and sub-features (items)
 * @access  Private
 */
router.get('/:hotelId/amenities', getHotelContext, async (req, res) => {
  try {
    const { Room } = req.hotelModels;
    const rooms = await Room.findAll({ attributes: ['amenities'] }).catch(() => []);
    const allAmenities = new Set();
    rooms.forEach((r) => {
      (r.amenities || []).forEach((a) => allAmenities.add(String(a).trim()));
    });

    const featureCategories = [
      { id: 'in_room', label: 'In-Room', icon: 'Bed', items: ['Wi-Fi', 'TV', 'AC', 'Mini Bar', 'Safe', 'Coffee Maker'] },
      { id: 'bathroom', label: 'Bathroom', icon: 'Droplets', items: ['Hair Dryer', 'Toiletries', 'Bathtub', 'Shower'] },
      { id: 'property', label: 'Property-Wide', icon: 'Building2', items: ['Swimming Pool', 'Gym', 'Spa', 'Restaurant', 'Parking', 'Room Service'] },
      { id: 'connectivity', label: 'Connectivity', icon: 'Wifi', items: ['Wi-Fi', 'Business Center', 'Meeting Room'] },
    ];

    const flatItems = featureCategories.flatMap((c) => c.items);
    [...allAmenities].forEach((a) => {
      if (a && !flatItems.some((i) => i.toLowerCase() === a.toLowerCase())) {
        featureCategories[0].items.push(a);
      }
    });

    // Load hotel-defined amenities from main database
    const hotelDefined = await HotelAmenity.findAll({
      where: { hotelId: req.params.hotelId },
      order: [['name', 'ASC']],
    }).catch(() => []);

    // Map hotel-defined amenities into categories
    hotelDefined.forEach((a) => {
      const catId = a.category === 'hotel' || a.category === 'property' ? 'property' : 'in_room';
      const target = featureCategories.find((c) => c.id === catId);
      if (!target) return;
      const name = (a.name || '').trim();
      if (!name) return;
      if (!target.items.some((i) => i.toLowerCase() === name.toLowerCase())) {
        target.items.push(name);
      }
    });

    const amenities = featureCategories.map((cat) => ({
      ...cat,
      items: cat.items.map((name, idx) => {
        const match = hotelDefined.find(
          (a) => a && String(a.name || '').toLowerCase() === String(name).toLowerCase()
        );
        return {
          id: match ? String(match.id) : `${cat.id}-${idx}`,
          name,
          available: match ? Boolean(match.available) : true,
          category: match ? (match.category === 'hotel' ? 'property' : 'room') : cat.id,
          description: match ? match.description || '' : '',
          roomNumber: match && match.roomNumber ? String(match.roomNumber) : null,
          floor: match && typeof match.floor === 'number' ? match.floor : null,
        };
      }),
    }));

    res.json({
      amenities,
      categories: featureCategories.map(({ id, label, icon }) => ({ id, label, icon })),
    });
  } catch (error) {
    console.error('Get amenities error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/hotel-data/:hotelId/amenities
 * @desc    Create a hotel-level amenity definition
 * @access  Private
 */
router.post(
  '/:hotelId/amenities',
  getHotelContext,
  [
    body('name').trim().notEmpty().withMessage('Amenity name is required'),
    body('category').trim().isIn(['room', 'hotel']).withMessage('Amenity category must be room or hotel'),
    body('available').optional().isBoolean().withMessage('Availability must be boolean'),
    body('roomNumber').optional({ nullable: true }).trim().isString(),
    body('floor').optional({ nullable: true }).toInt().isInt({ min: 0 }).withMessage('Floor must be a non-negative integer'),
    body('description').optional({ nullable: true }).isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const floorVal = req.body.floor != null && req.body.floor !== ''
        ? parseInt(Number(req.body.floor), 10)
        : null;
      const floorSaved = (typeof floorVal === 'number' && !Number.isNaN(floorVal) && floorVal >= 0) ? floorVal : null;

      const amenity = await HotelAmenity.create({
        hotelId: req.params.hotelId,
        name: String(req.body.name || '').trim(),
        category: req.body.category === 'hotel' ? 'hotel' : 'room',
        available: req.body.available !== undefined ? Boolean(req.body.available) : true,
        roomNumber: req.body.roomNumber != null && String(req.body.roomNumber).trim().length
          ? String(req.body.roomNumber).trim()
          : null,
        floor: floorSaved,
        description: req.body.description != null ? String(req.body.description) : null,
      });

      res.status(201).json({ amenity });
    } catch (error) {
      console.error('Create hotel amenity error:', error);
      res.status(500).json({ message: 'Failed to create amenity', error: error.message });
    }
  }
);

/**
 * @route   GET /api/hotel-data/:hotelId/rooms
 * @desc    Get all rooms for a hotel
 * @access  Private
 */
router.get('/:hotelId/rooms', getHotelContext, async (req, res) => {
  try {
    const { Room } = req.hotelModels;
    const rooms = await Room.findAll({
      order: [['floor', 'ASC'], ['roomNumber', 'ASC']],
    });

    // Fetch hotel-defined amenities from main database
    const hotelAmenities = await HotelAmenity.findAll({
      where: { hotelId: req.params.hotelId },
      order: [['name', 'ASC']],
    }).catch(() => []);

    // Enrich each room with matching amenities from HotelAmenity
    const enrichedRooms = rooms.map((room) => {
      const roomData = room.toJSON();
      const roomAmenities = new Set(roomData.amenities || []);

      // Add amenities that match this room's roomNumber
      hotelAmenities.forEach((amenity) => {
        const amenityData = amenity.toJSON();
        if (amenityData.roomNumber && String(amenityData.roomNumber).trim() === String(roomData.roomNumber).trim()) {
          if (amenityData.available && amenityData.name) {
            roomAmenities.add(String(amenityData.name).trim());
          }
        }
        // Add amenities that match this room's floor (and don't have a specific roomNumber)
        else if (amenityData.floor != null && amenityData.roomNumber == null && Number(amenityData.floor) === Number(roomData.floor)) {
          if (amenityData.available && amenityData.name) {
            roomAmenities.add(String(amenityData.name).trim());
          }
        }
        // Add general hotel amenities (no roomNumber or floor specified)
        else if (!amenityData.roomNumber && amenityData.floor == null && amenityData.category === 'hotel') {
          if (amenityData.available && amenityData.name) {
            roomAmenities.add(String(amenityData.name).trim());
          }
        }
      });

      return {
        ...roomData,
        amenities: Array.from(roomAmenities).sort(),
      };
    });

    res.json({ rooms: enrichedRooms });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/hotel-data/:hotelId/rooms/:roomId
 * @desc    Get single room by id
 * @access  Private
 */
router.get('/:hotelId/rooms/:roomId', getHotelContext, async (req, res) => {
  try {
    const { Room } = req.hotelModels;
    const room = await Room.findByPk(req.params.roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json({ room });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/hotel-data/:hotelId/rooms
 * @desc    Create new room
 * @access  Private
 */
router.post(
  '/:hotelId/rooms',
  getHotelContext,
  [
    body('roomNumber').trim().notEmpty().withMessage('Room number is required'),
    body('roomType').custom((val) => val != null && String(val).trim().length > 0).withMessage('Room type is required'),
    body('floor').toInt().isInt({ min: 0 }).withMessage('Floor must be a non-negative integer'),
    body('pricePerNight').toFloat().isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
    body('capacity').optional().toInt().isInt({ min: 1 }),
    body('status').optional().isIn(['available', 'occupied', 'maintenance', 'cleaning']),
    body('description').optional().isString(),
    body('amenities').optional().isArray(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { Room } = req.hotelModels;
      const rawAmenities = Array.isArray(req.body.amenities) ? req.body.amenities : [];
      const amenities = rawAmenities.map((a) => (a != null ? String(a) : '')).filter(Boolean);
      const payload = {
        roomNumber: String(req.body.roomNumber || '').trim(),
        roomType: String(req.body.roomType || '').trim(),
        floor: parseInt(Number(req.body.floor), 10) || 0,
        pricePerNight: parseFloat(Number(req.body.pricePerNight)) || 0,
        capacity: parseInt(Number(req.body.capacity), 10) || 2,
        status: ['available', 'occupied', 'maintenance', 'cleaning'].includes(req.body.status) ? req.body.status : 'available',
        description: req.body.description != null ? String(req.body.description) : null,
        amenities,
      };
      const room = await Room.create(payload);
      res.status(201).json({ room });
    } catch (error) {
      console.error('Create room error:', error);
      const message = error.name === 'SequelizeUniqueConstraintError'
        ? 'A room with this room number already exists.'
        : (error.message || 'Server error');
      res.status(500).json({ message, error: error.message });
    }
  }
);

/**
 * @route   PUT /api/hotel-data/:hotelId/rooms/:roomId
 * @desc    Update room
 * @access  Private
 */
router.put(
  '/:hotelId/rooms/:roomId',
  getHotelContext,
  [
    body('roomNumber').optional().trim().notEmpty(),
    body('roomType').optional().custom((val) => val == null || (String(val).trim().length > 0)),
    body('floor').optional().toInt().isInt({ min: 0 }),
    body('pricePerNight').optional().toFloat().isFloat({ min: 0 }),
    body('capacity').optional().toInt().isInt({ min: 1 }),
    body('status').optional().isIn(['available', 'occupied', 'maintenance', 'cleaning']),
    body('description').optional().isString(),
    body('amenities').optional().isArray(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { Room } = req.hotelModels;
      const room = await Room.findByPk(req.params.roomId);
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }

      const updates = ['roomNumber', 'roomType', 'floor', 'pricePerNight', 'capacity', 'status', 'description', 'amenities'];
      updates.forEach((key) => {
        if (req.body[key] !== undefined) {
          room[key] = req.body[key];
        }
      });
      await room.save();
      res.json({ room });
    } catch (error) {
      console.error('Update room error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   DELETE /api/hotel-data/:hotelId/rooms/:roomId
 * @desc    Delete room
 * @access  Private
 */
router.delete('/:hotelId/rooms/:roomId', getHotelContext, async (req, res) => {
  try {
    const { Room } = req.hotelModels;
    const room = await Room.findByPk(req.params.roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    await room.destroy();
    res.json({ message: 'Room deleted' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== STAFF ASSIGNMENT / SCHEDULING ====================

const STAFF_ROLES = ['Housekeeping', 'Laundry', 'Inspector', 'Supervisor', 'Other'];
const STAFF_SHIFTS = ['Morning', 'Afternoon', 'Night'];
const ATTENDANCE_STATUSES = ['Present', 'Absent', 'On Leave', 'Off'];

/**
 * @route   GET /api/hotel-data/:hotelId/staff-members
 * @desc    List housekeeping-related staff members
 * @access  Private
 */
router.get('/:hotelId/staff-members', getHotelContext, async (req, res) => {
  try {
    const { StaffMember } = req.hotelModels;
    await StaffMember.sync({ alter: false });
    const where = {};
    if (req.query.includeInactive !== 'true') {
      where.isActive = true;
    }
    const staff = await StaffMember.findAll({
      where,
      order: [['name', 'ASC']],
    });
    res.json({ staff });
  } catch (error) {
    console.error('Get staff members error:', error);
    res.status(500).json({ message: 'Failed to load staff members', error: error.message });
  }
});

/**
 * @route   POST /api/hotel-data/:hotelId/staff-members
 * @desc    Create a staff member
 * @access  Private
 */
router.post(
  '/:hotelId/staff-members',
  getHotelContext,
  [
    body('name').trim().notEmpty().withMessage('Staff name is required'),
    body('role').optional().isIn(STAFF_ROLES),
    body('department').optional({ nullable: true }).isString(),
    body('primaryArea').optional({ nullable: true }).isString(),
    body('colorTag').optional({ nullable: true }).isString(),
    body('roomNo').optional({ nullable: true }).isString(),
    body('floor').optional({ nullable: true }).isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { StaffMember } = req.hotelModels;
      const payload = {
        name: String(req.body.name || '').trim(),
        role: STAFF_ROLES.includes(req.body.role) ? req.body.role : 'Housekeeping',
        department: req.body.department != null ? String(req.body.department).trim() : null,
        primaryArea: req.body.primaryArea != null ? String(req.body.primaryArea).trim() : null,
        colorTag: req.body.colorTag != null ? String(req.body.colorTag).trim() : null,
        roomNo: req.body.roomNo != null ? String(req.body.roomNo).trim() : null,
        floor: req.body.floor != null ? String(req.body.floor).trim() : null,
      };

      const staff = await StaffMember.create(payload);
      res.status(201).json({ staff: staff.toJSON() });
    } catch (error) {
      console.error('Create staff member error:', error);
      res.status(500).json({ message: 'Failed to create staff member', error: error.message });
    }
  }
);

/**
 * @route   PUT /api/hotel-data/:hotelId/staff-members/:id
 * @desc    Update a staff member
 * @access  Private
 */
router.put(
  '/:hotelId/staff-members/:id',
  getHotelContext,
  [
    body('name').optional().isString(),
    body('role').optional().isIn(STAFF_ROLES),
    body('department').optional({ nullable: true }).isString(),
    body('primaryArea').optional({ nullable: true }).isString(),
    body('colorTag').optional({ nullable: true }).isString(),
    body('isActive').optional().isBoolean(),
    body('roomNo').optional({ nullable: true }).isString(),
    body('floor').optional({ nullable: true }).isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { StaffMember } = req.hotelModels;
      const staff = await StaffMember.findByPk(req.params.id);
      if (!staff) {
        return res.status(404).json({ message: 'Staff member not found' });
      }

      if (req.body.name !== undefined) {
        staff.name = String(req.body.name).trim();
      }
      if (req.body.role !== undefined && STAFF_ROLES.includes(req.body.role)) {
        staff.role = req.body.role;
      }
      if (req.body.department !== undefined) {
        staff.department = req.body.department != null ? String(req.body.department).trim() : null;
      }
      if (req.body.primaryArea !== undefined) {
        staff.primaryArea = req.body.primaryArea != null ? String(req.body.primaryArea).trim() : null;
      }
      if (req.body.colorTag !== undefined) {
        staff.colorTag = req.body.colorTag != null ? String(req.body.colorTag).trim() : null;
      }
      if (req.body.isActive !== undefined) {
        staff.isActive = Boolean(req.body.isActive);
      }
      if (req.body.roomNo !== undefined) {
        staff.roomNo = req.body.roomNo != null ? String(req.body.roomNo).trim() : null;
      }
      if (req.body.floor !== undefined) {
        staff.floor = req.body.floor != null ? String(req.body.floor).trim() : null;
      }

      await staff.save();
      res.json({ staff: staff.toJSON() });
    } catch (error) {
      console.error('Update staff member error:', error);
      res.status(500).json({ message: 'Failed to update staff member', error: error.message });
    }
  }
);

/**
 * @route   DELETE /api/hotel-data/:hotelId/staff-members/:id
 * @desc    Soft-delete a staff member (mark inactive)
 * @access  Private
 */
router.delete('/:hotelId/staff-members/:id', getHotelContext, async (req, res) => {
  try {
    const { StaffMember } = req.hotelModels;
    const staff = await StaffMember.findByPk(req.params.id);
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    staff.isActive = false;
    await staff.save();
    res.json({ message: 'Staff member deactivated' });
  } catch (error) {
    console.error('Delete staff member error:', error);
    res.status(500).json({ message: 'Failed to delete staff member', error: error.message });
  }
});

/**
 * @route   GET /api/hotel-data/:hotelId/staff-schedules
 * @desc    List staff schedules (optionally filter by date or staff)
 * @access  Private
 */
router.get('/:hotelId/staff-schedules', getHotelContext, async (req, res) => {
  try {
    const { StaffSchedule } = req.hotelModels;
    const where = {};
    if (req.query.date) {
      where.date = req.query.date;
    }
    if (req.query.staffId) {
      where.staffId = req.query.staffId;
    }
    const schedules = await StaffSchedule.findAll({
      where,
      order: [['date', 'ASC'], ['shift', 'ASC'], ['staffName', 'ASC']],
    });
    res.json({ schedules });
  } catch (error) {
    console.error('Get staff schedules error:', error);
    res.status(500).json({ message: 'Failed to load staff schedules', error: error.message });
  }
});

/**
 * @route   POST /api/hotel-data/:hotelId/staff-schedules
 * @desc    Create a staff schedule entry
 * @access  Private
 */
router.post(
  '/:hotelId/staff-schedules',
  getHotelContext,
  [
    body('staffId').trim().notEmpty().withMessage('Staff ID is required'),
    body('staffName').trim().notEmpty().withMessage('Staff name is required'),
    body('date').optional().isISO8601().withMessage('Invalid date format'),
    body('shift').optional().isIn(STAFF_SHIFTS),
    body('role').optional().isIn(STAFF_ROLES),
    body('assignedRooms').optional().isInt({ min: 0 }),
    body('assignedTasks').optional().isInt({ min: 0 }),
    body('workloadScore').optional().isInt({ min: 0 }),
    body('attendanceStatus').optional().isIn(ATTENDANCE_STATUSES),
    body('hoursWorked').optional().isFloat({ min: 0 }),
    body('overtimeHours').optional().isFloat({ min: 0 }),
    body('performanceScore').optional().isFloat({ min: 0 }),
    body('inspectionsPassed').optional().isInt({ min: 0 }),
    body('inspectionsFailed').optional().isInt({ min: 0 }),
    body('notes').optional({ nullable: true }).isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { StaffSchedule } = req.hotelModels;
      const today = new Date();
      const date = req.body.date || today.toISOString().slice(0, 10);

      const payload = {
        staffId: req.body.staffId,
        staffName: String(req.body.staffName || '').trim(),
        date,
        shift: STAFF_SHIFTS.includes(req.body.shift) ? req.body.shift : 'Morning',
        role: STAFF_ROLES.includes(req.body.role) ? req.body.role : 'Housekeeping',
        assignedRooms: req.body.assignedRooms != null ? Number(req.body.assignedRooms) : 0,
        assignedTasks: req.body.assignedTasks != null ? Number(req.body.assignedTasks) : 0,
        workloadScore: req.body.workloadScore != null ? Number(req.body.workloadScore) : 0,
        attendanceStatus: ATTENDANCE_STATUSES.includes(req.body.attendanceStatus)
          ? req.body.attendanceStatus
          : 'Present',
        hoursWorked: req.body.hoursWorked != null ? Number(req.body.hoursWorked) : 0,
        overtimeHours: req.body.overtimeHours != null ? Number(req.body.overtimeHours) : 0,
        performanceScore: req.body.performanceScore != null ? Number(req.body.performanceScore) : 0,
        inspectionsPassed: req.body.inspectionsPassed != null ? Number(req.body.inspectionsPassed) : 0,
        inspectionsFailed: req.body.inspectionsFailed != null ? Number(req.body.inspectionsFailed) : 0,
        notes: req.body.notes != null ? String(req.body.notes).trim() : null,
      };

      const schedule = await StaffSchedule.create(payload);
      res.status(201).json({ schedule: schedule.toJSON() });
    } catch (error) {
      console.error('Create staff schedule error:', error);
      res.status(500).json({ message: 'Failed to create staff schedule', error: error.message });
    }
  }
);

/**
 * @route   PUT /api/hotel-data/:hotelId/staff-schedules/:id
 * @desc    Update a staff schedule entry
 * @access  Private
 */
router.put(
  '/:hotelId/staff-schedules/:id',
  getHotelContext,
  [
    body('date').optional().isISO8601().withMessage('Invalid date format'),
    body('shift').optional().isIn(STAFF_SHIFTS),
    body('role').optional().isIn(STAFF_ROLES),
    body('assignedRooms').optional().isInt({ min: 0 }),
    body('assignedTasks').optional().isInt({ min: 0 }),
    body('workloadScore').optional().isInt({ min: 0 }),
    body('attendanceStatus').optional().isIn(ATTENDANCE_STATUSES),
    body('hoursWorked').optional().isFloat({ min: 0 }),
    body('overtimeHours').optional().isFloat({ min: 0 }),
    body('performanceScore').optional().isFloat({ min: 0 }),
    body('inspectionsPassed').optional().isInt({ min: 0 }),
    body('inspectionsFailed').optional().isInt({ min: 0 }),
    body('notes').optional({ nullable: true }).isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { StaffSchedule } = req.hotelModels;
      const schedule = await StaffSchedule.findByPk(req.params.id);
      if (!schedule) {
        return res.status(404).json({ message: 'Staff schedule not found' });
      }

      if (req.body.date !== undefined) {
        schedule.date = req.body.date;
      }
      if (req.body.shift !== undefined && STAFF_SHIFTS.includes(req.body.shift)) {
        schedule.shift = req.body.shift;
      }
      if (req.body.role !== undefined && STAFF_ROLES.includes(req.body.role)) {
        schedule.role = req.body.role;
      }
      if (req.body.assignedRooms !== undefined) {
        schedule.assignedRooms = Number(req.body.assignedRooms);
      }
      if (req.body.assignedTasks !== undefined) {
        schedule.assignedTasks = Number(req.body.assignedTasks);
      }
      if (req.body.workloadScore !== undefined) {
        schedule.workloadScore = Number(req.body.workloadScore);
      }
      if (req.body.attendanceStatus !== undefined && ATTENDANCE_STATUSES.includes(req.body.attendanceStatus)) {
        schedule.attendanceStatus = req.body.attendanceStatus;
      }
      if (req.body.hoursWorked !== undefined) {
        schedule.hoursWorked = Number(req.body.hoursWorked);
      }
      if (req.body.overtimeHours !== undefined) {
        schedule.overtimeHours = Number(req.body.overtimeHours);
      }
      if (req.body.performanceScore !== undefined) {
        schedule.performanceScore = Number(req.body.performanceScore);
      }
      if (req.body.inspectionsPassed !== undefined) {
        schedule.inspectionsPassed = Number(req.body.inspectionsPassed);
      }
      if (req.body.inspectionsFailed !== undefined) {
        schedule.inspectionsFailed = Number(req.body.inspectionsFailed);
      }
      if (req.body.notes !== undefined) {
        schedule.notes = req.body.notes != null ? String(req.body.notes).trim() : null;
      }

      await schedule.save();
      res.json({ schedule: schedule.toJSON() });
    } catch (error) {
      console.error('Update staff schedule error:', error);
      res.status(500).json({ message: 'Failed to update staff schedule', error: error.message });
    }
  }
);

/**
 * @route   DELETE /api/hotel-data/:hotelId/staff-schedules/:id
 * @desc    Delete a staff schedule entry
 * @access  Private
 */
router.delete('/:hotelId/staff-schedules/:id', getHotelContext, async (req, res) => {
  try {
    const { StaffSchedule } = req.hotelModels;
    const schedule = await StaffSchedule.findByPk(req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: 'Staff schedule not found' });
    }
    await schedule.destroy();
    res.json({ message: 'Staff schedule deleted' });
  } catch (error) {
    console.error('Delete staff schedule error:', error);
    res.status(500).json({ message: 'Failed to delete staff schedule', error: error.message });
  }
});

/**
 * @route   GET /api/hotel-data/:hotelId/menu-categories
 * @desc    List menu categories
 * @access  Private
 */
router.get('/:hotelId/menu-categories', getHotelContext, async (req, res) => {
  try {
    const { MenuCategory } = req.hotelModels;
    const where = {};
    if (req.query.includeInactive !== 'true') {
      where.isActive = true;
    }
    const categories = await MenuCategory.findAll({
      where,
      order: [['displayOrder', 'ASC'], ['name', 'ASC']],
    });
    res.json({ categories });
  } catch (error) {
    console.error('Get menu categories error:', error);
    res.status(500).json({ message: 'Failed to load menu categories', error: error.message });
  }
});

/**
 * @route   POST /api/hotel-data/:hotelId/menu-categories
 * @desc    Create a menu category
 * @access  Private
 */
router.post(
  '/:hotelId/menu-categories',
  getHotelContext,
  [
    body('name').trim().notEmpty().withMessage('Category name is required'),
    body('description').optional().isString(),
    body('displayOrder').optional().isInt({ min: 0 }),
    body('colorTag').optional().isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { MenuCategory } = req.hotelModels;
      const payload = {
        name: String(req.body.name || '').trim(),
        description: req.body.description != null ? String(req.body.description).trim() : null,
        displayOrder: Number(req.body.displayOrder || 0),
        isActive: req.body.isActive !== false,
        colorTag: req.body.colorTag != null ? String(req.body.colorTag).trim() : null,
      };

      const category = await MenuCategory.create(payload);
      res.status(201).json({ category: category.toJSON() });
    } catch (error) {
      console.error('Create menu category error:', error);
      res.status(500).json({ message: 'Failed to create menu category', error: error.message });
    }
  }
);

/**
 * @route   PUT /api/hotel-data/:hotelId/menu-categories/:id
 * @desc    Update a menu category
 * @access  Private
 */
router.put(
  '/:hotelId/menu-categories/:id',
  getHotelContext,
  [
    body('name').optional().isString(),
    body('description').optional().isString(),
    body('displayOrder').optional().isInt({ min: 0 }),
    body('isActive').optional().isBoolean(),
    body('colorTag').optional().isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { MenuCategory } = req.hotelModels;
      const category = await MenuCategory.findByPk(req.params.id);
      if (!category) {
        return res.status(404).json({ message: 'Menu category not found' });
      }

      if (req.body.name !== undefined) {
        category.name = String(req.body.name).trim();
      }
      if (req.body.description !== undefined) {
        category.description = req.body.description != null ? String(req.body.description).trim() : null;
      }
      if (req.body.displayOrder !== undefined) {
        category.displayOrder = Number(req.body.displayOrder);
      }
      if (req.body.isActive !== undefined) {
        category.isActive = Boolean(req.body.isActive);
      }
      if (req.body.colorTag !== undefined) {
        category.colorTag = req.body.colorTag != null ? String(req.body.colorTag).trim() : null;
      }

      await category.save();
      res.json({ category: category.toJSON() });
    } catch (error) {
      console.error('Update menu category error:', error);
      res.status(500).json({ message: 'Failed to update menu category', error: error.message });
    }
  }
);

/**
 * @route   DELETE /api/hotel-data/:hotelId/menu-categories/:id
 * @desc    Delete a menu category (soft delete)
 * @access  Private
 */
router.delete('/:hotelId/menu-categories/:id', getHotelContext, async (req, res) => {
  try {
    const { MenuCategory } = req.hotelModels;
    const category = await MenuCategory.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Menu category not found' });
    }
    category.isActive = false;
    await category.save();
    res.json({ message: 'Menu category deactivated' });
  } catch (error) {
    console.error('Delete menu category error:', error);
    res.status(500).json({ message: 'Failed to delete menu category', error: error.message });
  }
});

/**
 * @route   GET /api/hotel-data/:hotelId/menu-items
 * @desc    List menu items (optionally filter by category, availability)
 * @access  Private
 */
router.get('/:hotelId/menu-items', getHotelContext, async (req, res) => {
  try {
    const { MenuItem } = req.hotelModels;
    const where = {};
    if (req.query.categoryId) {
      where.categoryId = req.query.categoryId;
    }
    if (req.query.isAvailable !== undefined) {
      where.isAvailable = req.query.isAvailable === 'true';
    }
    if (req.query.isVeg !== undefined) {
      where.isVeg = req.query.isVeg === 'true';
    }
    const items = await MenuItem.findAll({
      where,
      order: [['displayOrder', 'ASC'], ['name', 'ASC']],
    });
    res.json({ items });
  } catch (error) {
    console.error('Get menu items error:', error);
    res.status(500).json({ message: 'Failed to load menu items', error: error.message });
  }
});

/**
 * @route   POST /api/hotel-data/:hotelId/menu-items
 * @desc    Create a menu item
 * @access  Private
 */
router.post(
  '/:hotelId/menu-items',
  getHotelContext,
  [
    body('name').trim().notEmpty().withMessage('Item name is required'),
    body('categoryId').isUUID().withMessage('Valid category ID is required'),
    body('price').custom((value) => {
      const num = Number(value);
      if (isNaN(num) || num < 0) {
        throw new Error('Price must be a non-negative number');
      }
      return true;
    }),
    body('taxRate').optional().custom((value) => {
      const num = Number(value);
      if (isNaN(num) || num < 0 || num > 100) {
        throw new Error('Tax rate must be between 0 and 100');
      }
      return true;
    }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { MenuItem } = req.hotelModels;
      const payload = {
        name: String(req.body.name || '').trim(),
        description: req.body.description != null ? String(req.body.description).trim() : null,
        categoryId: req.body.categoryId,
        price: Number(req.body.price || 0),
        taxRate: Number(req.body.taxRate || 0),
        isAvailable: req.body.isAvailable !== false,
        isVeg: req.body.isVeg !== false,
        imageUrl: req.body.imageUrl != null ? String(req.body.imageUrl).trim() : null,
        addOns: Array.isArray(req.body.addOns) ? req.body.addOns : [],
        timeBasedPricing: req.body.timeBasedPricing || null,
        stockLinked: Boolean(req.body.stockLinked),
        stockItemId: req.body.stockItemId || null,
        recipeMapping: req.body.recipeMapping || null,
        comboLinked: Boolean(req.body.comboLinked),
        comboItems: Array.isArray(req.body.comboItems) ? req.body.comboItems : [],
        displayOrder: Number(req.body.displayOrder || 0),
      };

      const item = await MenuItem.create(payload);
      res.status(201).json({ item: item.toJSON() });
    } catch (error) {
      console.error('Create menu item error:', error);
      res.status(500).json({ message: 'Failed to create menu item', error: error.message });
    }
  }
);

/**
 * @route   PUT /api/hotel-data/:hotelId/menu-items/:id
 * @desc    Update a menu item
 * @access  Private
 */
router.put(
  '/:hotelId/menu-items/:id',
  getHotelContext,
  [
    body('name').optional().isString(),
    body('categoryId').optional().isUUID(),
    body('price').optional().custom((value) => {
      const num = Number(value);
      if (isNaN(num) || num < 0) {
        throw new Error('Price must be a non-negative number');
      }
      return true;
    }),
    body('taxRate').optional().custom((value) => {
      const num = Number(value);
      if (isNaN(num) || num < 0 || num > 100) {
        throw new Error('Tax rate must be between 0 and 100');
      }
      return true;
    }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { MenuItem } = req.hotelModels;
      const item = await MenuItem.findByPk(req.params.id);
      if (!item) {
        return res.status(404).json({ message: 'Menu item not found' });
      }

      if (req.body.name !== undefined) {
        item.name = String(req.body.name).trim();
      }
      if (req.body.description !== undefined) {
        item.description = req.body.description != null ? String(req.body.description).trim() : null;
      }
      if (req.body.categoryId !== undefined) {
        item.categoryId = req.body.categoryId;
      }
      if (req.body.price !== undefined) {
        item.price = Number(req.body.price);
      }
      if (req.body.taxRate !== undefined) {
        item.taxRate = Number(req.body.taxRate);
      }
      if (req.body.isAvailable !== undefined) {
        item.isAvailable = Boolean(req.body.isAvailable);
      }
      if (req.body.isVeg !== undefined) {
        item.isVeg = Boolean(req.body.isVeg);
      }
      if (req.body.imageUrl !== undefined) {
        item.imageUrl = req.body.imageUrl != null ? String(req.body.imageUrl).trim() : null;
      }
      if (req.body.addOns !== undefined) {
        item.addOns = Array.isArray(req.body.addOns) ? req.body.addOns : [];
      }
      if (req.body.timeBasedPricing !== undefined) {
        item.timeBasedPricing = req.body.timeBasedPricing;
      }
      if (req.body.stockLinked !== undefined) {
        item.stockLinked = Boolean(req.body.stockLinked);
      }
      if (req.body.stockItemId !== undefined) {
        item.stockItemId = req.body.stockItemId || null;
      }
      if (req.body.recipeMapping !== undefined) {
        item.recipeMapping = req.body.recipeMapping;
      }
      if (req.body.comboLinked !== undefined) {
        item.comboLinked = Boolean(req.body.comboLinked);
      }
      if (req.body.comboItems !== undefined) {
        item.comboItems = Array.isArray(req.body.comboItems) ? req.body.comboItems : [];
      }
      if (req.body.displayOrder !== undefined) {
        item.displayOrder = Number(req.body.displayOrder);
      }

      await item.save();
      res.json({ item: item.toJSON() });
    } catch (error) {
      console.error('Update menu item error:', error);
      res.status(500).json({ message: 'Failed to update menu item', error: error.message });
    }
  }
);

/**
 * @route   DELETE /api/hotel-data/:hotelId/menu-items/:id
 * @desc    Delete a menu item (hard delete)
 * @access  Private
 */
router.delete('/:hotelId/menu-items/:id', getHotelContext, async (req, res) => {
  try {
    const { MenuItem } = req.hotelModels;
    const item = await MenuItem.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    await item.destroy();
    res.json({ message: 'Menu item deleted' });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ message: 'Failed to delete menu item', error: error.message });
  }
});

/**
 * @route   GET /api/hotel-data/:hotelId/restaurant-tables
 * @desc    List restaurant tables (optionally filter by status, floor)
 * @access  Private
 */
router.get('/:hotelId/restaurant-tables', getHotelContext, async (req, res) => {
  try {
    const { RestaurantTable } = req.hotelModels;
    const where = {};
    if (req.query.status) {
      where.status = req.query.status;
    }
    if (req.query.floor) {
      where.floor = req.query.floor;
    }
    const tables = await RestaurantTable.findAll({
      where,
      order: [['tableNo', 'ASC']],
    });
    res.json({ tables });
  } catch (error) {
    console.error('Get restaurant tables error:', error);
    res.status(500).json({ message: 'Failed to load restaurant tables', error: error.message });
  }
});

/**
 * @route   POST /api/hotel-data/:hotelId/restaurant-tables
 * @desc    Create a restaurant table
 * @access  Private
 */
router.post(
  '/:hotelId/restaurant-tables',
  getHotelContext,
  [
    body('tableNo').trim().notEmpty().withMessage('Table number is required'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
    body('floor').optional().isString(),
    body('status').optional().isIn(['Available', 'Occupied', 'Reserved', 'Cleaning', 'Out of Service']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { RestaurantTable } = req.hotelModels;
      const payload = {
        tableNo: String(req.body.tableNo || '').trim(),
        capacity: Number(req.body.capacity || 2),
        floor: req.body.floor != null ? String(req.body.floor).trim() : null,
        status: ['Available', 'Occupied', 'Reserved', 'Cleaning', 'Out of Service'].includes(req.body.status)
          ? req.body.status
          : 'Available',
        positionX: req.body.positionX != null ? Number(req.body.positionX) : null,
        positionY: req.body.positionY != null ? Number(req.body.positionY) : null,
        notes: req.body.notes != null ? String(req.body.notes).trim() : null,
      };

      const table = await RestaurantTable.create(payload);
      res.status(201).json({ table: table.toJSON() });
    } catch (error) {
      console.error('Create restaurant table error:', error);
      res.status(500).json({ message: 'Failed to create restaurant table', error: error.message });
    }
  }
);

/**
 * @route   PUT /api/hotel-data/:hotelId/restaurant-tables/:id
 * @desc    Update a restaurant table
 * @access  Private
 */
router.put(
  '/:hotelId/restaurant-tables/:id',
  getHotelContext,
  [
    body('tableNo').optional().isString(),
    body('capacity').optional().isInt({ min: 1 }),
    body('status').optional().isIn(['Available', 'Occupied', 'Reserved', 'Cleaning', 'Out of Service']),
    body('assignedWaiterId').optional().isString(),
    body('assignedWaiterName').optional().isString(),
    body('currentGuestName').optional().isString(),
    body('currentGuestPhone').optional().isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { RestaurantTable } = req.hotelModels;
      const table = await RestaurantTable.findByPk(req.params.id);
      if (!table) {
        return res.status(404).json({ message: 'Restaurant table not found' });
      }

      if (req.body.tableNo !== undefined) {
        table.tableNo = String(req.body.tableNo).trim();
      }
      if (req.body.capacity !== undefined) {
        table.capacity = Number(req.body.capacity);
      }
      if (req.body.floor !== undefined) {
        table.floor = req.body.floor != null ? String(req.body.floor).trim() : null;
      }
      if (req.body.status !== undefined) {
        table.status = req.body.status;
      }
      if (req.body.assignedWaiterId !== undefined) {
        table.assignedWaiterId = req.body.assignedWaiterId || null;
      }
      if (req.body.assignedWaiterName !== undefined) {
        table.assignedWaiterName = req.body.assignedWaiterName || null;
      }
      if (req.body.currentGuestName !== undefined) {
        table.currentGuestName = req.body.currentGuestName || null;
      }
      if (req.body.currentGuestPhone !== undefined) {
        table.currentGuestPhone = req.body.currentGuestPhone || null;
      }
      if (req.body.positionX !== undefined) {
        table.positionX = req.body.positionX != null ? Number(req.body.positionX) : null;
      }
      if (req.body.positionY !== undefined) {
        table.positionY = req.body.positionY != null ? Number(req.body.positionY) : null;
      }
      if (req.body.qrCode !== undefined) {
        table.qrCode = req.body.qrCode != null ? String(req.body.qrCode) : null;
      }
      if (req.body.mergedWith !== undefined) {
        table.mergedWith = Array.isArray(req.body.mergedWith) ? req.body.mergedWith : [];
      }
      if (req.body.notes !== undefined) {
        table.notes = req.body.notes != null ? String(req.body.notes).trim() : null;
      }

      await table.save();
      res.json({ table: table.toJSON() });
    } catch (error) {
      console.error('Update restaurant table error:', error);
      res.status(500).json({ message: 'Failed to update restaurant table', error: error.message });
    }
  }
);

/**
 * @route   DELETE /api/hotel-data/:hotelId/restaurant-tables/:id
 * @desc    Delete a restaurant table
 * @access  Private
 */
router.delete('/:hotelId/restaurant-tables/:id', getHotelContext, async (req, res) => {
  try {
    const { RestaurantTable } = req.hotelModels;
    const table = await RestaurantTable.findByPk(req.params.id);
    if (!table) {
      return res.status(404).json({ message: 'Restaurant table not found' });
    }
    await table.destroy();
    res.json({ message: 'Restaurant table deleted' });
  } catch (error) {
    console.error('Delete restaurant table error:', error);
    res.status(500).json({ message: 'Failed to delete restaurant table', error: error.message });
  }
});

/**
 * @route   GET /api/hotel-data/:hotelId/table-reservations
 * @desc    List table reservations (optionally filter by date, status, tableId)
 * @access  Private
 */
router.get('/:hotelId/table-reservations', getHotelContext, async (req, res) => {
  try {
    const { TableReservation } = req.hotelModels;
    const where = {};
    if (req.query.tableId) {
      where.tableId = req.query.tableId;
    }
    if (req.query.reservationDate) {
      where.reservationDate = req.query.reservationDate;
    }
    if (req.query.status) {
      where.status = req.query.status;
    }
    const reservations = await TableReservation.findAll({
      where,
      order: [['reservationDate', 'ASC'], ['reservationTime', 'ASC']],
    });
    res.json({ reservations });
  } catch (error) {
    console.error('Get table reservations error:', error);
    res.status(500).json({ message: 'Failed to load table reservations', error: error.message });
  }
});

/**
 * @route   POST /api/hotel-data/:hotelId/table-reservations
 * @desc    Create a table reservation
 * @access  Private
 */
router.post(
  '/:hotelId/table-reservations',
  getHotelContext,
  [
    body('tableId').isUUID().withMessage('Valid table ID is required'),
    body('tableNo').trim().notEmpty().withMessage('Table number is required'),
    body('guestName').trim().notEmpty().withMessage('Guest name is required'),
    body('reservationDate').isISO8601().withMessage('Valid reservation date is required'),
    body('reservationTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time format (HH:MM) is required'),
    body('partySize').optional().isInt({ min: 1 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { TableReservation } = req.hotelModels;
      const payload = {
        tableId: req.body.tableId,
        tableNo: String(req.body.tableNo || '').trim(),
        guestName: String(req.body.guestName || '').trim(),
        guestPhone: req.body.guestPhone != null ? String(req.body.guestPhone).trim() : null,
        guestEmail: req.body.guestEmail != null ? String(req.body.guestEmail).trim() : null,
        reservationDate: req.body.reservationDate,
        reservationTime: req.body.reservationTime,
        duration: Number(req.body.duration || 120),
        partySize: Number(req.body.partySize || 2),
        status: ['Pending', 'Confirmed', 'Seated', 'Completed', 'Cancelled', 'No Show'].includes(req.body.status)
          ? req.body.status
          : 'Pending',
        specialRequests: req.body.specialRequests != null ? String(req.body.specialRequests).trim() : null,
        confirmedBy: req.body.confirmedBy != null ? String(req.body.confirmedBy).trim() : null,
      };

      const reservation = await TableReservation.create(payload);
      res.status(201).json({ reservation: reservation.toJSON() });
    } catch (error) {
      console.error('Create table reservation error:', error);
      res.status(500).json({ message: 'Failed to create table reservation', error: error.message });
    }
  }
);

/**
 * @route   PUT /api/hotel-data/:hotelId/table-reservations/:id
 * @desc    Update a table reservation
 * @access  Private
 */
router.put(
  '/:hotelId/table-reservations/:id',
  getHotelContext,
  [
    body('status').optional().isIn(['Pending', 'Confirmed', 'Seated', 'Completed', 'Cancelled', 'No Show']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { TableReservation } = req.hotelModels;
      const reservation = await TableReservation.findByPk(req.params.id);
      if (!reservation) {
        return res.status(404).json({ message: 'Table reservation not found' });
      }

      if (req.body.status !== undefined) {
        reservation.status = req.body.status;
      }
      if (req.body.guestName !== undefined) {
        reservation.guestName = String(req.body.guestName).trim();
      }
      if (req.body.guestPhone !== undefined) {
        reservation.guestPhone = req.body.guestPhone != null ? String(req.body.guestPhone).trim() : null;
      }
      if (req.body.guestEmail !== undefined) {
        reservation.guestEmail = req.body.guestEmail != null ? String(req.body.guestEmail).trim() : null;
      }
      if (req.body.reservationDate !== undefined) {
        reservation.reservationDate = req.body.reservationDate;
      }
      if (req.body.reservationTime !== undefined) {
        reservation.reservationTime = req.body.reservationTime;
      }
      if (req.body.partySize !== undefined) {
        reservation.partySize = Number(req.body.partySize);
      }
      if (req.body.specialRequests !== undefined) {
        reservation.specialRequests = req.body.specialRequests != null ? String(req.body.specialRequests).trim() : null;
      }

      await reservation.save();
      res.json({ reservation: reservation.toJSON() });
    } catch (error) {
      console.error('Update table reservation error:', error);
      res.status(500).json({ message: 'Failed to update table reservation', error: error.message });
    }
  }
);

/**
 * @route   DELETE /api/hotel-data/:hotelId/table-reservations/:id
 * @desc    Delete a table reservation
 * @access  Private
 */
router.delete('/:hotelId/table-reservations/:id', getHotelContext, async (req, res) => {
  try {
    const { TableReservation } = req.hotelModels;
    const reservation = await TableReservation.findByPk(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: 'Table reservation not found' });
    }
    await reservation.destroy();
    res.json({ message: 'Table reservation deleted' });
  } catch (error) {
    console.error('Delete table reservation error:', error);
    res.status(500).json({ message: 'Failed to delete table reservation', error: error.message });
  }
});

/**
 * @route   GET /api/hotel-data/:hotelId/combo-offers
 * @desc    List combo offers
 * @access  Private
 */
router.get('/:hotelId/combo-offers', getHotelContext, async (req, res) => {
  try {
    const { ComboOffer } = req.hotelModels;
    const where = {};
    if (req.query.isActive !== undefined) {
      where.isActive = req.query.isActive === 'true';
    }
    const combos = await ComboOffer.findAll({
      where,
      order: [['displayOrder', 'ASC'], ['createdAt', 'DESC']],
    });
    res.json({ combos });
  } catch (error) {
    console.error('Get combo offers error:', error);
    res.status(500).json({ message: 'Failed to load combo offers', error: error.message });
  }
});

/**
 * @route   POST /api/hotel-data/:hotelId/combo-offers
 * @desc    Create a combo offer
 * @access  Private
 */
router.post(
  '/:hotelId/combo-offers',
  getHotelContext,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('comboPrice').custom((value) => {
      if (value == null || isNaN(Number(value)) || Number(value) <= 0) {
        throw new Error('Valid combo price is required');
      }
      return true;
    }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { ComboOffer } = req.hotelModels;
      const items = Array.isArray(req.body.items) ? req.body.items : [];
      const originalPrice = items.reduce((sum, item) => {
        return sum + (Number(item.price || 0) * Number(item.quantity || 1));
      }, 0);
      const comboPrice = Number(req.body.comboPrice);
      const discountAmount = originalPrice - comboPrice;
      const discountPercentage = originalPrice > 0 ? (discountAmount / originalPrice) * 100 : 0;

      const payload = {
        name: String(req.body.name || '').trim(),
        description: req.body.description != null ? String(req.body.description).trim() : null,
        items,
        comboPrice,
        originalPrice,
        discountAmount,
        discountPercentage: discountPercentage.toFixed(2),
        imageUrl: req.body.imageUrl != null ? String(req.body.imageUrl).trim() : null,
        isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : true,
        displayOrder: Number(req.body.displayOrder || 0),
      };

      const combo = await ComboOffer.create(payload);
      res.status(201).json({ combo: combo.toJSON() });
    } catch (error) {
      console.error('Create combo offer error:', error);
      res.status(500).json({ message: 'Failed to create combo offer', error: error.message });
    }
  }
);

/**
 * @route   PUT /api/hotel-data/:hotelId/combo-offers/:id
 * @desc    Update a combo offer
 * @access  Private
 */
router.put(
  '/:hotelId/combo-offers/:id',
  getHotelContext,
  async (req, res) => {
    try {
      const { ComboOffer } = req.hotelModels;
      const combo = await ComboOffer.findByPk(req.params.id);
      if (!combo) {
        return res.status(404).json({ message: 'Combo offer not found' });
      }

      if (req.body.name !== undefined) {
        combo.name = String(req.body.name).trim();
      }
      if (req.body.description !== undefined) {
        combo.description = req.body.description != null ? String(req.body.description).trim() : null;
      }
      if (req.body.items !== undefined) {
        combo.items = Array.isArray(req.body.items) ? req.body.items : [];
        const originalPrice = combo.items.reduce((sum, item) => {
          return sum + (Number(item.price || 0) * Number(item.quantity || 1));
        }, 0);
        combo.originalPrice = originalPrice;
        if (req.body.comboPrice !== undefined) {
          combo.comboPrice = Number(req.body.comboPrice);
          combo.discountAmount = originalPrice - combo.comboPrice;
          combo.discountPercentage = originalPrice > 0 ? ((combo.discountAmount / originalPrice) * 100).toFixed(2) : 0;
        }
      }
      if (req.body.comboPrice !== undefined && req.body.items === undefined) {
        combo.comboPrice = Number(req.body.comboPrice);
        combo.discountAmount = combo.originalPrice - combo.comboPrice;
        combo.discountPercentage = combo.originalPrice > 0 ? ((combo.discountAmount / combo.originalPrice) * 100).toFixed(2) : 0;
      }
      if (req.body.imageUrl !== undefined) {
        combo.imageUrl = req.body.imageUrl != null ? String(req.body.imageUrl).trim() : null;
      }
      if (req.body.isActive !== undefined) {
        combo.isActive = Boolean(req.body.isActive);
      }
      if (req.body.displayOrder !== undefined) {
        combo.displayOrder = Number(req.body.displayOrder);
      }

      await combo.save();
      res.json({ combo: combo.toJSON() });
    } catch (error) {
      console.error('Update combo offer error:', error);
      res.status(500).json({ message: 'Failed to update combo offer', error: error.message });
    }
  }
);

/**
 * @route   DELETE /api/hotel-data/:hotelId/combo-offers/:id
 * @desc    Delete a combo offer
 * @access  Private
 */
router.delete('/:hotelId/combo-offers/:id', getHotelContext, async (req, res) => {
  try {
    const { ComboOffer } = req.hotelModels;
    const combo = await ComboOffer.findByPk(req.params.id);
    if (!combo) {
      return res.status(404).json({ message: 'Combo offer not found' });
    }
    await combo.destroy();
    res.json({ message: 'Combo offer deleted' });
  } catch (error) {
    console.error('Delete combo offer error:', error);
    res.status(500).json({ message: 'Failed to delete combo offer', error: error.message });
  }
});

/**
 * @route   GET /api/hotel-data/:hotelId/discount-offers
 * @desc    List discount offers
 * @access  Private
 */
router.get('/:hotelId/discount-offers', getHotelContext, async (req, res) => {
  try {
    const { DiscountOffer } = req.hotelModels;
    const where = {};
    if (req.query.isActive !== undefined) {
      where.isActive = req.query.isActive === 'true';
    }
    const discounts = await DiscountOffer.findAll({
      where,
      order: [['priority', 'DESC'], ['createdAt', 'DESC']],
    });
    res.json({ discounts });
  } catch (error) {
    console.error('Get discount offers error:', error);
    res.status(500).json({ message: 'Failed to load discount offers', error: error.message });
  }
});

/**
 * @route   POST /api/hotel-data/:hotelId/discount-offers
 * @desc    Create a discount offer
 * @access  Private
 */
router.post(
  '/:hotelId/discount-offers',
  getHotelContext,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('discountType').isIn(['Percentage', 'Flat']).withMessage('Discount type must be Percentage or Flat'),
    body('discountValue').custom((value) => {
      if (value == null || isNaN(Number(value)) || Number(value) <= 0) {
        throw new Error('Valid discount value is required');
      }
      return true;
    }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { DiscountOffer } = req.hotelModels;
      const payload = {
        name: String(req.body.name || '').trim(),
        description: req.body.description != null ? String(req.body.description).trim() : null,
        discountType: req.body.discountType,
        discountValue: Number(req.body.discountValue),
        minOrderValue: req.body.minOrderValue != null ? Number(req.body.minOrderValue) : null,
        maxDiscountAmount: req.body.maxDiscountAmount != null ? Number(req.body.maxDiscountAmount) : null,
        applicableItems: Array.isArray(req.body.applicableItems) ? req.body.applicableItems : null,
        applicableCategories: Array.isArray(req.body.applicableCategories) ? req.body.applicableCategories : null,
        priority: Number(req.body.priority || 0),
        isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : true,
        startDate: req.body.startDate || null,
        endDate: req.body.endDate || null,
        startTime: req.body.startTime || null,
        endTime: req.body.endTime || null,
        limitedQuantity: req.body.limitedQuantity != null ? Number(req.body.limitedQuantity) : null,
        usedQuantity: 0,
        autoApply: req.body.autoApply !== undefined ? Boolean(req.body.autoApply) : false,
      };

      const discount = await DiscountOffer.create(payload);
      res.status(201).json({ discount: discount.toJSON() });
    } catch (error) {
      console.error('Create discount offer error:', error);
      res.status(500).json({ message: 'Failed to create discount offer', error: error.message });
    }
  }
);

/**
 * @route   PUT /api/hotel-data/:hotelId/discount-offers/:id
 * @desc    Update a discount offer
 * @access  Private
 */
router.put(
  '/:hotelId/discount-offers/:id',
  getHotelContext,
  async (req, res) => {
    try {
      const { DiscountOffer } = req.hotelModels;
      const discount = await DiscountOffer.findByPk(req.params.id);
      if (!discount) {
        return res.status(404).json({ message: 'Discount offer not found' });
      }

      const fields = ['name', 'description', 'discountType', 'discountValue', 'minOrderValue', 'maxDiscountAmount', 'applicableItems', 'applicableCategories', 'priority', 'isActive', 'startDate', 'endDate', 'startTime', 'endTime', 'limitedQuantity', 'autoApply'];
      fields.forEach((field) => {
        if (req.body[field] !== undefined) {
          if (field === 'discountValue' || field === 'minOrderValue' || field === 'maxDiscountAmount' || field === 'priority' || field === 'limitedQuantity') {
            discount[field] = req.body[field] != null ? Number(req.body[field]) : null;
          } else if (field === 'applicableItems' || field === 'applicableCategories') {
            discount[field] = Array.isArray(req.body[field]) ? req.body[field] : null;
          } else if (field === 'isActive' || field === 'autoApply') {
            discount[field] = Boolean(req.body[field]);
          } else {
            discount[field] = req.body[field] != null ? String(req.body[field]).trim() : null;
          }
        }
      });

      await discount.save();
      res.json({ discount: discount.toJSON() });
    } catch (error) {
      console.error('Update discount offer error:', error);
      res.status(500).json({ message: 'Failed to update discount offer', error: error.message });
    }
  }
);

/**
 * @route   DELETE /api/hotel-data/:hotelId/discount-offers/:id
 * @desc    Delete a discount offer
 * @access  Private
 */
router.delete('/:hotelId/discount-offers/:id', getHotelContext, async (req, res) => {
  try {
    const { DiscountOffer } = req.hotelModels;
    const discount = await DiscountOffer.findByPk(req.params.id);
    if (!discount) {
      return res.status(404).json({ message: 'Discount offer not found' });
    }
    await discount.destroy();
    res.json({ message: 'Discount offer deleted' });
  } catch (error) {
    console.error('Delete discount offer error:', error);
    res.status(500).json({ message: 'Failed to delete discount offer', error: error.message });
  }
});

/**
 * @route   GET /api/hotel-data/:hotelId/coupon-codes
 * @desc    List coupon codes
 * @access  Private
 */
router.get('/:hotelId/coupon-codes', getHotelContext, async (req, res) => {
  try {
    const { CouponCode } = req.hotelModels;
    const where = {};
    if (req.query.isActive !== undefined) {
      where.isActive = req.query.isActive === 'true';
    }
    const coupons = await CouponCode.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
    res.json({ coupons });
  } catch (error) {
    console.error('Get coupon codes error:', error);
    res.status(500).json({ message: 'Failed to load coupon codes', error: error.message });
  }
});

/**
 * @route   POST /api/hotel-data/:hotelId/coupon-codes
 * @desc    Create a coupon code
 * @access  Private
 */
router.post(
  '/:hotelId/coupon-codes',
  getHotelContext,
  [
    body('code').trim().notEmpty().withMessage('Code is required'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('discountType').isIn(['Percentage', 'Flat']).withMessage('Discount type must be Percentage or Flat'),
    body('discountValue').custom((value) => {
      if (value == null || isNaN(Number(value)) || Number(value) <= 0) {
        throw new Error('Valid discount value is required');
      }
      return true;
    }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { CouponCode } = req.hotelModels;
      const payload = {
        code: String(req.body.code || '').trim().toUpperCase(),
        name: String(req.body.name || '').trim(),
        description: req.body.description != null ? String(req.body.description).trim() : null,
        discountType: req.body.discountType,
        discountValue: Number(req.body.discountValue),
        minOrderValue: req.body.minOrderValue != null ? Number(req.body.minOrderValue) : null,
        maxDiscountAmount: req.body.maxDiscountAmount != null ? Number(req.body.maxDiscountAmount) : null,
        maxUses: req.body.maxUses != null ? Number(req.body.maxUses) : null,
        usedCount: 0,
        maxUsesPerUser: Number(req.body.maxUsesPerUser || 1),
        isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : true,
        startDate: req.body.startDate || null,
        endDate: req.body.endDate || null,
        applicableItems: Array.isArray(req.body.applicableItems) ? req.body.applicableItems : null,
        applicableCategories: Array.isArray(req.body.applicableCategories) ? req.body.applicableCategories : null,
      };

      const coupon = await CouponCode.create(payload);
      res.status(201).json({ coupon: coupon.toJSON() });
    } catch (error) {
      console.error('Create coupon code error:', error);
      if (error.name === 'SequelizeUniqueConstraintError') {
        res.status(400).json({ message: 'Coupon code already exists' });
      } else {
        res.status(500).json({ message: 'Failed to create coupon code', error: error.message });
      }
    }
  }
);

/**
 * @route   PUT /api/hotel-data/:hotelId/coupon-codes/:id
 * @desc    Update a coupon code
 * @access  Private
 */
router.put(
  '/:hotelId/coupon-codes/:id',
  getHotelContext,
  async (req, res) => {
    try {
      const { CouponCode } = req.hotelModels;
      const coupon = await CouponCode.findByPk(req.params.id);
      if (!coupon) {
        return res.status(404).json({ message: 'Coupon code not found' });
      }

      const fields = ['code', 'name', 'description', 'discountType', 'discountValue', 'minOrderValue', 'maxDiscountAmount', 'maxUses', 'maxUsesPerUser', 'isActive', 'startDate', 'endDate', 'applicableItems', 'applicableCategories'];
      fields.forEach((field) => {
        if (req.body[field] !== undefined) {
          if (field === 'code') {
            coupon[field] = String(req.body[field]).trim().toUpperCase();
          } else if (field === 'discountValue' || field === 'minOrderValue' || field === 'maxDiscountAmount' || field === 'maxUses' || field === 'maxUsesPerUser') {
            coupon[field] = req.body[field] != null ? Number(req.body[field]) : null;
          } else if (field === 'applicableItems' || field === 'applicableCategories') {
            coupon[field] = Array.isArray(req.body[field]) ? req.body[field] : null;
          } else if (field === 'isActive') {
            coupon[field] = Boolean(req.body[field]);
          } else {
            coupon[field] = req.body[field] != null ? String(req.body[field]).trim() : null;
          }
        }
      });

      await coupon.save();
      res.json({ coupon: coupon.toJSON() });
    } catch (error) {
      console.error('Update coupon code error:', error);
      if (error.name === 'SequelizeUniqueConstraintError') {
        res.status(400).json({ message: 'Coupon code already exists' });
      } else {
        res.status(500).json({ message: 'Failed to update coupon code', error: error.message });
      }
    }
  }
);

/**
 * @route   DELETE /api/hotel-data/:hotelId/coupon-codes/:id
 * @desc    Delete a coupon code
 * @access  Private
 */
router.delete('/:hotelId/coupon-codes/:id', getHotelContext, async (req, res) => {
  try {
    const { CouponCode } = req.hotelModels;
    const coupon = await CouponCode.findByPk(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon code not found' });
    }
    await coupon.destroy();
    res.json({ message: 'Coupon code deleted' });
  } catch (error) {
    console.error('Delete coupon code error:', error);
    res.status(500).json({ message: 'Failed to delete coupon code', error: error.message });
  }
});

/**
 * @route   GET /api/hotel-data/:hotelId/kitchen-kots
 * @desc    List kitchen KOTs (optionally filter by status, section, tableNo, billId)
 * @access  Private
 */
router.get('/:hotelId/kitchen-kots', getHotelContext, async (req, res) => {
  try {
    const { KitchenKOT } = req.hotelModels;
    const where = {};
    if (req.query.status) {
      where.status = req.query.status;
    }
    if (req.query.section) {
      where.section = req.query.section;
    }
    if (req.query.tableNo) {
      where.tableNo = req.query.tableNo;
    }
    if (req.query.billId) {
      where.billId = req.query.billId;
    }
    const kots = await KitchenKOT.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
    res.json({ kots });
  } catch (error) {
    console.error('Get kitchen KOTs error:', error);
    res.status(500).json({ message: 'Failed to load kitchen KOTs', error: error.message });
  }
});

/**
 * @route   POST /api/hotel-data/:hotelId/kitchen-kots
 * @desc    Create a kitchen KOT (auto-generate or manual)
 * @access  Private
 */
router.post(
  '/:hotelId/kitchen-kots',
  getHotelContext,
  [
    body('billId').isUUID().withMessage('Valid bill ID is required'),
    body('tableNo').trim().notEmpty().withMessage('Table number is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { KitchenKOT } = req.hotelModels;
      // Generate KOT number (e.g., KOT-20260203-001)
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const count = await KitchenKOT.count({ where: { kotNumber: { [Op.like]: `KOT-${dateStr}-%` } } });
      const kotNumber = `KOT-${dateStr}-${String(count + 1).padStart(3, '0')}`;

      const payload = {
        kotNumber,
        billId: req.body.billId,
        tableNo: String(req.body.tableNo || '').trim(),
        guestName: req.body.guestName != null ? String(req.body.guestName).trim() : null,
        items: Array.isArray(req.body.items) ? req.body.items : [],
        section: req.body.section != null ? String(req.body.section).trim() : null,
        status: ['Pending', 'Preparing', 'Ready', 'Cancelled', 'Completed'].includes(req.body.status)
          ? req.body.status
          : 'Pending',
        assignedChefId: req.body.assignedChefId != null ? String(req.body.assignedChefId) : null,
        assignedChefName: req.body.assignedChefName != null ? String(req.body.assignedChefName).trim() : null,
        estimatedTime: req.body.estimatedTime != null ? Number(req.body.estimatedTime) : null,
        notes: req.body.notes != null ? String(req.body.notes).trim() : null,
        autoGenerated: req.body.autoGenerated !== undefined ? Boolean(req.body.autoGenerated) : false,
      };

      const kot = await KitchenKOT.create(payload);
      res.status(201).json({ kot: kot.toJSON() });
    } catch (error) {
      console.error('Create kitchen KOT error:', error);
      res.status(500).json({ message: 'Failed to create kitchen KOT', error: error.message });
    }
  }
);

/**
 * @route   PUT /api/hotel-data/:hotelId/kitchen-kots/:id
 * @desc    Update a kitchen KOT (status, items, chef assignment, etc.)
 * @access  Private
 */
router.put(
  '/:hotelId/kitchen-kots/:id',
  getHotelContext,
  async (req, res) => {
    try {
      const { KitchenKOT } = req.hotelModels;
      const kot = await KitchenKOT.findByPk(req.params.id);
      if (!kot) {
        return res.status(404).json({ message: 'Kitchen KOT not found' });
      }

      if (req.body.status !== undefined) {
        kot.status = req.body.status;
        if (req.body.status === 'Preparing' && !kot.preparationStartTime) {
          kot.preparationStartTime = new Date();
        }
        if (req.body.status === 'Ready' || req.body.status === 'Completed') {
          kot.preparationEndTime = new Date();
        }
      }
      if (req.body.items !== undefined) {
        kot.items = Array.isArray(req.body.items) ? req.body.items : [];
      }
      if (req.body.section !== undefined) {
        kot.section = req.body.section != null ? String(req.body.section).trim() : null;
      }
      if (req.body.assignedChefId !== undefined) {
        kot.assignedChefId = req.body.assignedChefId || null;
      }
      if (req.body.assignedChefName !== undefined) {
        kot.assignedChefName = req.body.assignedChefName != null ? String(req.body.assignedChefName).trim() : null;
      }
      if (req.body.estimatedTime !== undefined) {
        kot.estimatedTime = req.body.estimatedTime != null ? Number(req.body.estimatedTime) : null;
      }
      if (req.body.notes !== undefined) {
        kot.notes = req.body.notes != null ? String(req.body.notes).trim() : null;
      }
      if (req.body.printedAt !== undefined) {
        kot.printedAt = req.body.printedAt ? new Date(req.body.printedAt) : null;
        if (req.body.printedAt) {
          kot.printCount = (kot.printCount || 0) + 1;
        }
      }

      await kot.save();
      res.json({ kot: kot.toJSON() });
    } catch (error) {
      console.error('Update kitchen KOT error:', error);
      res.status(500).json({ message: 'Failed to update kitchen KOT', error: error.message });
    }
  }
);

/**
 * @route   DELETE /api/hotel-data/:hotelId/kitchen-kots/:id
 * @desc    Delete/Cancel a kitchen KOT
 * @access  Private
 */
router.delete('/:hotelId/kitchen-kots/:id', getHotelContext, async (req, res) => {
  try {
    const { KitchenKOT } = req.hotelModels;
    const kot = await KitchenKOT.findByPk(req.params.id);
    if (!kot) {
      return res.status(404).json({ message: 'Kitchen KOT not found' });
    }
    await kot.destroy();
    res.json({ message: 'Kitchen KOT deleted' });
  } catch (error) {
    console.error('Delete kitchen KOT error:', error);
    res.status(500).json({ message: 'Failed to delete kitchen KOT', error: error.message });
  }
});

/**
 * ============================
 * Bar Order Tracking (BOT)
 * ============================
 */

/**
 * @route   GET /api/hotel-data/:hotelId/bar-orders
 * @desc    List bar orders (optional filter by status, location, q)
 * @access  Private
 */
router.get('/:hotelId/bar-orders', getHotelContext, async (req, res) => {
  try {
    const { BarOrder } = req.hotelModels;
    const where = {};
    if (req.query.status) {
      where.status = req.query.status;
    }
    if (req.query.location) {
      where.location = req.query.location;
    }
    if (req.query.q) {
      const q = String(req.query.q || '').trim();
      if (q) {
        where[Op.or] = [
          { orderNumber: { [Op.iLike]: `%${q}%` } },
          { location: { [Op.iLike]: `%${q}%` } },
        ];
      }
    }
    const orders = await BarOrder.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
    res.json({ orders });
  } catch (error) {
    console.error('Get bar orders error:', error);
    res.status(500).json({ message: 'Failed to load bar orders', error: error.message });
  }
});

/**
 * @route   POST /api/hotel-data/:hotelId/bar-orders
 * @desc    Create a bar order
 * @access  Private
 */
router.post(
  '/:hotelId/bar-orders',
  getHotelContext,
  [
    body('location').optional().isString(),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('subtotal').optional().custom((v) => {
      const n = Number(v);
      if (isNaN(n) || n < 0) throw new Error('Subtotal must be a non-negative number');
      return true;
    }),
    body('totalAmount').optional().custom((v) => {
      const n = Number(v);
      if (isNaN(n) || n < 0) throw new Error('Total must be a non-negative number');
      return true;
    }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { BarOrder } = req.hotelModels;

      // Generate order number (e.g., BOT-20260203-001)
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const count = await BarOrder.count({ where: { orderNumber: { [Op.like]: `BOT-${dateStr}-%` } } });
      const orderNumber = `BOT-${dateStr}-${String(count + 1).padStart(3, '0')}`;

      const payload = {
        orderNumber,
        location: req.body.location != null && String(req.body.location).trim()
          ? String(req.body.location).trim()
          : 'Bar',
        items: Array.isArray(req.body.items) ? req.body.items : [],
        status: ['Pending', 'Mixing', 'Ready', 'Served', 'Cancelled'].includes(req.body.status)
          ? req.body.status
          : 'Pending',
        subtotal: req.body.subtotal != null ? Number(req.body.subtotal) : 0,
        happyHourApplied: req.body.happyHourApplied !== undefined ? Boolean(req.body.happyHourApplied) : false,
        happyHourDiscount: req.body.happyHourDiscount != null ? Number(req.body.happyHourDiscount) : 0,
        totalAmount: req.body.totalAmount != null ? Number(req.body.totalAmount) : 0,
        ageVerified: req.body.ageVerified !== undefined ? Boolean(req.body.ageVerified) : false,
        notes: req.body.notes != null ? String(req.body.notes).trim() : null,
      };

      const order = await BarOrder.create(payload);
      res.status(201).json({ order: order.toJSON() });
    } catch (error) {
      console.error('Create bar order error:', error);
      res.status(500).json({ message: 'Failed to create bar order', error: error.message });
    }
  },
);

/**
 * @route   PUT /api/hotel-data/:hotelId/bar-orders/:id
 * @desc    Update bar order (status, items, age verification) + optional stock deduction
 * @access  Private
 */
router.put('/:hotelId/bar-orders/:id', getHotelContext, async (req, res) => {
  try {
    const { BarOrder, BarInventoryItem } = req.hotelModels;
    const order = await BarOrder.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Bar order not found' });
    }

    const fields = ['location', 'status', 'items', 'subtotal', 'happyHourApplied', 'happyHourDiscount', 'totalAmount', 'ageVerified', 'notes'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'subtotal' || field === 'happyHourDiscount' || field === 'totalAmount') {
          order[field] = Number(req.body[field] || 0);
        } else if (field === 'happyHourApplied' || field === 'ageVerified') {
          order[field] = Boolean(req.body[field]);
        } else if (field === 'items') {
          order[field] = Array.isArray(req.body.items) ? req.body.items : [];
        } else if (field === 'location') {
          order[field] = String(req.body.location || '').trim() || 'Bar';
        } else if (field === 'status') {
          order[field] = ['Pending', 'Mixing', 'Ready', 'Served', 'Cancelled'].includes(req.body.status)
            ? req.body.status
            : order[field];
        } else {
          order[field] = req.body[field] != null ? String(req.body[field]).trim() : null;
        }
      }
    });

    // Optional: auto deduct stock when served
    const autoDeductStock = Boolean(req.body.autoDeductStock);
    const isServed = req.body.status === 'Served' || order.status === 'Served';
    if (autoDeductStock && isServed && BarInventoryItem) {
      const items = Array.isArray(order.items) ? order.items : [];
      for (const it of items) {
        if (!it) continue;
        const isAlcohol = Boolean(it.isAlcohol);
        if (!isAlcohol) continue;

        const name = String(it.name || '').trim();
        if (!name) continue;

        // naive match by name (case-insensitive)
        const inv = await BarInventoryItem.findOne({
          where: { name: { [Op.iLike]: name } },
        });
        if (!inv) continue;

        const qty = Number(it.quantity || 0);
        if (!qty || qty <= 0) continue;

        const unit = (inv.unit || '').toLowerCase();
        const size = String(it.size || 'S').toUpperCase();
        const mlPer = size === 'L' ? 100 : size === 'M' ? 75 : 50;
        const deduct = unit === 'ml' ? qty * mlPer : qty;
        inv.currentStock = Math.max(0, Number(inv.currentStock || 0) - deduct);
        await inv.save();
      }
    }

    await order.save();
    res.json({ order: order.toJSON() });
  } catch (error) {
    console.error('Update bar order error:', error);
    res.status(500).json({ message: 'Failed to update bar order', error: error.message });
  }
});

/**
 * @route   DELETE /api/hotel-data/:hotelId/bar-orders/:id
 * @desc    Cancel/delete a bar order
 * @access  Private
 */
router.delete('/:hotelId/bar-orders/:id', getHotelContext, async (req, res) => {
  try {
    const { BarOrder } = req.hotelModels;
    const order = await BarOrder.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Bar order not found' });
    }
    await order.destroy();
    res.json({ message: 'Bar order deleted' });
  } catch (error) {
    console.error('Delete bar order error:', error);
    res.status(500).json({ message: 'Failed to delete bar order', error: error.message });
  }
});

/**
 * @route   GET /api/hotel-data/:hotelId/bar-inventory
 * @desc    List bar inventory items
 * @access  Private
 */
router.get('/:hotelId/bar-inventory', getHotelContext, async (req, res) => {
  try {
    const { BarInventoryItem } = req.hotelModels;
    const items = await BarInventoryItem.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ items });
  } catch (error) {
    console.error('Get bar inventory error:', error);
    res.status(500).json({ message: 'Failed to load bar inventory', error: error.message });
  }
});

/**
 * @route   POST /api/hotel-data/:hotelId/bar-inventory
 * @desc    Create bar inventory item
 * @access  Private
 */
router.post(
  '/:hotelId/bar-inventory',
  getHotelContext,
  [body('name').trim().notEmpty().withMessage('Name is required')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { BarInventoryItem } = req.hotelModels;
      const payload = {
        name: String(req.body.name || '').trim(),
        category: req.body.category != null ? String(req.body.category).trim() : null,
        unit: req.body.unit != null ? String(req.body.unit).trim() : null,
        currentStock: req.body.currentStock != null ? Number(req.body.currentStock) : 0,
        reorderLevel: req.body.reorderLevel != null ? Number(req.body.reorderLevel) : 0,
        isAlcohol: req.body.isAlcohol !== undefined ? Boolean(req.body.isAlcohol) : true,
        bottleSizeMl: req.body.bottleSizeMl != null ? Number(req.body.bottleSizeMl) : null,
        notes: req.body.notes != null ? String(req.body.notes).trim() : null,
      };

      const item = await BarInventoryItem.create(payload);
      res.status(201).json({ item: item.toJSON() });
    } catch (error) {
      console.error('Create bar inventory item error:', error);
      res.status(500).json({ message: 'Failed to create bar inventory item', error: error.message });
    }
  },
);

/**
 * @route   PUT /api/hotel-data/:hotelId/bar-inventory/:id
 * @desc    Update bar inventory item
 * @access  Private
 */
router.put('/:hotelId/bar-inventory/:id', getHotelContext, async (req, res) => {
  try {
    const { BarInventoryItem } = req.hotelModels;
    const item = await BarInventoryItem.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    const fields = ['name', 'category', 'unit', 'currentStock', 'reorderLevel', 'isAlcohol', 'bottleSizeMl', 'notes'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'currentStock' || field === 'reorderLevel') {
          item[field] = Number(req.body[field] || 0);
        } else if (field === 'bottleSizeMl') {
          item[field] = req.body[field] != null ? Number(req.body[field]) : null;
        } else if (field === 'isAlcohol') {
          item[field] = Boolean(req.body[field]);
        } else if (field === 'name') {
          item[field] = String(req.body[field] || '').trim();
        } else {
          item[field] = req.body[field] != null ? String(req.body[field]).trim() : null;
        }
      }
    });

    await item.save();
    res.json({ item: item.toJSON() });
  } catch (error) {
    console.error('Update bar inventory item error:', error);
    res.status(500).json({ message: 'Failed to update bar inventory item', error: error.message });
  }
});

/**
 * @route   DELETE /api/hotel-data/:hotelId/bar-inventory/:id
 * @desc    Delete bar inventory item
 * @access  Private
 */
router.delete('/:hotelId/bar-inventory/:id', getHotelContext, async (req, res) => {
  try {
    const { BarInventoryItem } = req.hotelModels;
    const item = await BarInventoryItem.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    await item.destroy();
    res.json({ message: 'Inventory item deleted' });
  } catch (error) {
    console.error('Delete bar inventory item error:', error);
    res.status(500).json({ message: 'Failed to delete bar inventory item', error: error.message });
  }
});

/**
 * @route   GET /api/hotel-data/:hotelId/bar-reports/revenue
 * @desc    Revenue report for bar orders (served only)
 * @access  Private
 */
router.get('/:hotelId/bar-reports/revenue', getHotelContext, async (req, res) => {
  try {
    const { BarOrder } = req.hotelModels;
    const period = String(req.query.period || 'Daily');
    const orders = await BarOrder.findAll({
      where: { status: 'Served' },
      order: [['createdAt', 'ASC']],
    });

    const keyFn = (d) => {
      const date = new Date(d);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      if (period === 'Monthly') return `${yyyy}-${mm}`;
      if (period === 'Weekly') {
        const day = date.getDay();
        const diff = (day + 6) % 7;
        date.setDate(date.getDate() - diff);
        const wyyyy = date.getFullYear();
        const wmm = String(date.getMonth() + 1).padStart(2, '0');
        const wdd = String(date.getDate()).padStart(2, '0');
        return `${wyyyy}-${wmm}-${wdd}`;
      }
      return `${yyyy}-${mm}-${dd}`;
    };

    const map = new Map();
    orders.forEach((o) => {
      const k = keyFn(o.createdAt || new Date());
      map.set(k, (map.get(k) || 0) + Number(o.totalAmount || 0));
    });

    const series = Array.from(map.entries())
      .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
      .map(([k, revenue]) => ({ key: k, revenue: Number(revenue || 0) }));

    res.json({ period, series });
  } catch (error) {
    console.error('Bar revenue report error:', error);
    res.status(500).json({ message: 'Failed to load bar revenue report', error: error.message });
  }
});

/**
 * ============================
 * Room Service Orders
 * ============================
 */

/**
 * @route   GET /api/hotel-data/:hotelId/room-service-orders
 * @desc    List room-service orders (optional filters: status, roomNumber, priority)
 * @access  Private
 */
router.get('/:hotelId/room-service-orders', getHotelContext, async (req, res) => {
  try {
    const { RoomServiceOrder } = req.hotelModels;
    const where = {};
    if (req.query.status) {
      where.status = req.query.status;
    }
    if (req.query.roomNumber) {
      where.roomNumber = String(req.query.roomNumber);
    }
    if (req.query.priority) {
      where.priority = req.query.priority;
    }
    const orders = await RoomServiceOrder.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
    res.json({ orders });
  } catch (error) {
    console.error('Get room-service orders error:', error);
    res.status(500).json({ message: 'Failed to load room-service orders', error: error.message });
  }
});

/**
 * @route   GET /api/hotel-data/:hotelId/room-service/frontdesk-lookup
 * @desc    Lookup guest/booking for a room for room-service verification
 * @access  Private
 */
router.get('/:hotelId/room-service/frontdesk-lookup', getHotelContext, async (req, res) => {
  try {
    const { Booking } = req.hotelModels;
    const roomNumber = String(req.query.roomNumber || '').trim();
    if (!roomNumber) {
      return res.status(400).json({ message: 'roomNumber is required' });
    }

    const booking = await Booking.findOne({
      where: {
        roomNumber,
        status: { [Op.in]: ['confirmed', 'checked_in'] },
      },
      order: [['checkIn', 'DESC']],
    });

    if (!booking) {
      return res.status(404).json({ message: 'No active booking found for this room' });
    }

    const guest = {
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      roomNumber: booking.roomNumber,
      guestName: booking.guestName,
      status: booking.status,
    };

    res.json({ guest });
  } catch (error) {
    console.error('Room-service frontdesk lookup error:', error);
    res.status(500).json({ message: 'Failed to verify guest', error: error.message });
  }
});

/**
 * @route   POST /api/hotel-data/:hotelId/room-service-orders
 * @desc    Create a room-service order
 * @access  Private
 */
router.post(
  '/:hotelId/room-service-orders',
  getHotelContext,
  [
    body('roomNumber').trim().notEmpty().withMessage('Room number is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('subtotal').optional().custom((v) => {
      const n = Number(v);
      if (isNaN(n) || n < 0) throw new Error('Subtotal must be a non-negative number');
      return true;
    }),
    body('totalAmount').optional().custom((v) => {
      const n = Number(v);
      if (isNaN(n) || n < 0) throw new Error('Total must be a non-negative number');
      return true;
    }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { RoomServiceOrder, Booking } = req.hotelModels;

      // Generate order number (e.g., RS-20260203-001)
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const count = await RoomServiceOrder.count({
        where: { orderNumber: { [Op.like]: `RS-${dateStr}-%` } },
      });
      const orderNumber = `RS-${dateStr}-${String(count + 1).padStart(3, '0')}`;

      let guestName = req.body.guestName != null ? String(req.body.guestName).trim() : null;
      let bookingId = req.body.bookingId != null ? String(req.body.bookingId) : null;
      let bookingNumber = req.body.bookingNumber != null ? String(req.body.bookingNumber) : null;

      // Try to auto-link booking by room if not provided
      if (!bookingId || !bookingNumber) {
        const booking = await Booking.findOne({
          where: {
            roomNumber: String(req.body.roomNumber),
            status: { [Op.in]: ['confirmed', 'checked_in'] },
          },
          order: [['checkIn', 'DESC']],
        });
        if (booking) {
          bookingId = booking.id;
          bookingNumber = booking.bookingNumber;
          if (!guestName) {
            guestName = booking.guestName;
          }
        }
      }

      const subtotal = req.body.subtotal != null ? Number(req.body.subtotal) : 0;
      const serviceChargePercent =
        req.body.serviceChargePercent != null ? Number(req.body.serviceChargePercent) : 0;
      const serviceChargeAmount =
        req.body.serviceChargeAmount != null
          ? Number(req.body.serviceChargeAmount)
          : (subtotal * serviceChargePercent) / 100;
      const totalAmount =
        req.body.totalAmount != null ? Number(req.body.totalAmount) : subtotal + serviceChargeAmount;

      const payload = {
        orderNumber,
        roomNumber: String(req.body.roomNumber || '').trim(),
        guestName,
        bookingId,
        bookingNumber,
        items: Array.isArray(req.body.items) ? req.body.items : [],
        status:
          ['Pending', 'Preparing', 'OutForDelivery', 'Delivered', 'Cancelled'].includes(
            req.body.status,
          )
            ? req.body.status
            : 'Pending',
        priority: ['Normal', 'VIP', 'Urgent'].includes(req.body.priority)
          ? req.body.priority
          : 'Normal',
        specialInstructions:
          req.body.specialInstructions != null
            ? String(req.body.specialInstructions).trim()
            : null,
        estimatedDeliveryMinutes:
          req.body.estimatedDeliveryMinutes != null
            ? Number(req.body.estimatedDeliveryMinutes)
            : null,
        serviceChargePercent,
        serviceChargeAmount,
        subtotal,
        totalAmount,
        chargeToRoom: req.body.chargeToRoom !== undefined ? Boolean(req.body.chargeToRoom) : false,
        linkedToFrontDesk:
          req.body.linkedToFrontDesk !== undefined ? Boolean(req.body.linkedToFrontDesk) : false,
        notes: req.body.notes != null ? String(req.body.notes).trim() : null,
      };

      const order = await RoomServiceOrder.create(payload);
      res.status(201).json({ order: order.toJSON() });
    } catch (error) {
      console.error('Create room-service order error:', error);
      res.status(500).json({ message: 'Failed to create room-service order', error: error.message });
    }
  },
);

/**
 * @route   PUT /api/hotel-data/:hotelId/room-service-orders/:id
 * @desc    Update room-service order (status, ETA, instructions, charge to room, priority, etc.)
 * @access  Private
 */
router.put('/:hotelId/room-service-orders/:id', getHotelContext, async (req, res) => {
  try {
    const { RoomServiceOrder } = req.hotelModels;
    const order = await RoomServiceOrder.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Room-service order not found' });
    }

    const fields = [
      'roomNumber',
      'guestName',
      'bookingId',
      'bookingNumber',
      'status',
      'priority',
      'items',
      'specialInstructions',
      'estimatedDeliveryMinutes',
      'serviceChargePercent',
      'serviceChargeAmount',
      'subtotal',
      'totalAmount',
      'chargeToRoom',
      'linkedToFrontDesk',
      'notes',
    ];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (
          field === 'serviceChargePercent' ||
          field === 'serviceChargeAmount' ||
          field === 'subtotal' ||
          field === 'totalAmount'
        ) {
          order[field] = Number(req.body[field] || 0);
        } else if (field === 'estimatedDeliveryMinutes') {
          order[field] =
            req.body[field] != null && req.body[field] !== ''
              ? Number(req.body[field])
              : null;
        } else if (field === 'chargeToRoom' || field === 'linkedToFrontDesk') {
          order[field] = Boolean(req.body[field]);
        } else if (field === 'items') {
          order[field] = Array.isArray(req.body.items) ? req.body.items : [];
        } else if (field === 'status') {
          if (
            ['Pending', 'Preparing', 'OutForDelivery', 'Delivered', 'Cancelled'].includes(
              req.body.status,
            )
          ) {
            order.status = req.body.status;
          }
        } else if (field === 'priority') {
          if (['Normal', 'VIP', 'Urgent'].includes(req.body.priority)) {
            order.priority = req.body.priority;
          }
        } else {
          order[field] =
            req.body[field] != null ? String(req.body[field]).trim() : null;
        }
      }
    });

    // Optional auto-charge hook (for future integration with folio / payments)
    const autoChargeToRoomBill = Boolean(req.body.autoChargeToRoomBill);
    if (autoChargeToRoomBill && order.chargeToRoom) {
      // Here we could hook into a folio/payment model; for now just ensure flag is set.
      order.chargeToRoom = true;
    }

    await order.save();
    res.json({ order: order.toJSON() });
  } catch (error) {
    console.error('Update room-service order error:', error);
    res.status(500).json({ message: 'Failed to update room-service order', error: error.message });
  }
});

/**
 * @route   DELETE /api/hotel-data/:hotelId/room-service-orders/:id
 * @desc    Delete / cancel room-service order
 * @access  Private
 */
router.delete('/:hotelId/room-service-orders/:id', getHotelContext, async (req, res) => {
  try {
    const { RoomServiceOrder } = req.hotelModels;
    const order = await RoomServiceOrder.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Room-service order not found' });
    }
    await order.destroy();
    res.json({ message: 'Room-service order deleted' });
  } catch (error) {
    console.error('Delete room-service order error:', error);
    res.status(500).json({ message: 'Failed to delete room-service order', error: error.message });
  }
});

// ==================== TAKEAWAY / DELIVERY ====================

router.get('/:hotelId/takeaway-customers', getHotelContext, async (req, res) => {
  try {
    const { TakeawayCustomer } = req.hotelModels;
    const where = {};
    const q = String(req.query.q || '').trim();
    if (q) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { phone: { [Op.iLike]: `%${q}%` } },
        { email: { [Op.iLike]: `%${q}%` } },
      ];
    }
    const customers = await TakeawayCustomer.findAll({ where, order: [['name', 'ASC']] });
    res.json({ customers });
  } catch (error) {
    console.error('Get takeaway customers error:', error);
    res.status(500).json({ message: 'Failed to load customers', error: error.message });
  }
});

router.post('/:hotelId/takeaway-customers', getHotelContext, [body('name').trim().notEmpty().withMessage('Name is required')], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    const { TakeawayCustomer } = req.hotelModels;
    const payload = {
      name: String(req.body.name).trim(),
      phone: req.body.phone != null ? String(req.body.phone).trim() : null,
      email: req.body.email != null ? String(req.body.email).trim() : null,
      address: req.body.address != null ? String(req.body.address).trim() : null,
      pincode: req.body.pincode != null ? String(req.body.pincode).trim() : null,
      notes: req.body.notes != null ? String(req.body.notes).trim() : null,
    };
    const customer = await TakeawayCustomer.create(payload);
    res.status(201).json({ customer: customer.toJSON() });
  } catch (error) {
    console.error('Create takeaway customer error:', error);
    res.status(500).json({ message: 'Failed to create customer', error: error.message });
  }
});

router.put('/:hotelId/takeaway-customers/:id', getHotelContext, async (req, res) => {
  try {
    const { TakeawayCustomer } = req.hotelModels;
    const customer = await TakeawayCustomer.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    if (req.body.name !== undefined) customer.name = String(req.body.name).trim() || customer.name;
    if (req.body.phone !== undefined) customer.phone = req.body.phone != null ? String(req.body.phone).trim() : null;
    if (req.body.email !== undefined) customer.email = req.body.email != null ? String(req.body.email).trim() : null;
    if (req.body.address !== undefined) customer.address = req.body.address != null ? String(req.body.address).trim() : null;
    if (req.body.pincode !== undefined) customer.pincode = req.body.pincode != null ? String(req.body.pincode).trim() : null;
    if (req.body.notes !== undefined) customer.notes = req.body.notes != null ? String(req.body.notes).trim() : null;
    await customer.save();
    res.json({ customer: customer.toJSON() });
  } catch (error) {
    console.error('Update takeaway customer error:', error);
    res.status(500).json({ message: 'Failed to update customer', error: error.message });
  }
});

router.delete('/:hotelId/takeaway-customers/:id', getHotelContext, async (req, res) => {
  try {
    const { TakeawayCustomer } = req.hotelModels;
    const customer = await TakeawayCustomer.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    await customer.destroy();
    res.json({ message: 'Customer deleted' });
  } catch (error) {
    console.error('Delete takeaway customer error:', error);
    res.status(500).json({ message: 'Failed to delete customer', error: error.message });
  }
});

router.get('/:hotelId/delivery-partners', getHotelContext, async (req, res) => {
  try {
    const { DeliveryPartner } = req.hotelModels;
    const where = {};
    if (req.query.isAvailable !== undefined) where.isAvailable = req.query.isAvailable === 'true';
    const partners = await DeliveryPartner.findAll({ where, order: [['name', 'ASC']] });
    res.json({ partners });
  } catch (error) {
    console.error('Get delivery partners error:', error);
    res.status(500).json({ message: 'Failed to load delivery partners', error: error.message });
  }
});

router.post('/:hotelId/delivery-partners', getHotelContext, [body('name').trim().notEmpty().withMessage('Name is required')], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    const { DeliveryPartner } = req.hotelModels;
    const payload = {
      name: String(req.body.name).trim(),
      phone: req.body.phone != null ? String(req.body.phone).trim() : null,
      isAvailable: req.body.isAvailable !== undefined ? Boolean(req.body.isAvailable) : true,
      notes: req.body.notes != null ? String(req.body.notes).trim() : null,
    };
    const partner = await DeliveryPartner.create(payload);
    res.status(201).json({ partner: partner.toJSON() });
  } catch (error) {
    console.error('Create delivery partner error:', error);
    res.status(500).json({ message: 'Failed to create delivery partner', error: error.message });
  }
});

router.put('/:hotelId/delivery-partners/:id', getHotelContext, async (req, res) => {
  try {
    const { DeliveryPartner } = req.hotelModels;
    const partner = await DeliveryPartner.findByPk(req.params.id);
    if (!partner) return res.status(404).json({ message: 'Delivery partner not found' });
    if (req.body.name !== undefined) partner.name = String(req.body.name).trim() || partner.name;
    if (req.body.phone !== undefined) partner.phone = req.body.phone != null ? String(req.body.phone).trim() : null;
    if (req.body.isAvailable !== undefined) partner.isAvailable = Boolean(req.body.isAvailable);
    if (req.body.notes !== undefined) partner.notes = req.body.notes != null ? String(req.body.notes).trim() : null;
    await partner.save();
    res.json({ partner: partner.toJSON() });
  } catch (error) {
    console.error('Update delivery partner error:', error);
    res.status(500).json({ message: 'Failed to update delivery partner', error: error.message });
  }
});

router.delete('/:hotelId/delivery-partners/:id', getHotelContext, async (req, res) => {
  try {
    const { DeliveryPartner } = req.hotelModels;
    const partner = await DeliveryPartner.findByPk(req.params.id);
    if (!partner) return res.status(404).json({ message: 'Delivery partner not found' });
    await partner.destroy();
    res.json({ message: 'Delivery partner deleted' });
  } catch (error) {
    console.error('Delete delivery partner error:', error);
    res.status(500).json({ message: 'Failed to delete delivery partner', error: error.message });
  }
});

router.get('/:hotelId/takeaway-orders', getHotelContext, async (req, res) => {
  try {
    const { TakeawayDeliveryOrder } = req.hotelModels;
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.paymentStatus) where.paymentStatus = req.query.paymentStatus;
    if (req.query.orderType) where.orderType = req.query.orderType;
    const q = String(req.query.q || '').trim();
    if (q) {
      where[Op.or] = [
        { trackingId: { [Op.iLike]: `%${q}%` } },
        { customerName: { [Op.iLike]: `%${q}%` } },
        { customerPhone: { [Op.iLike]: `%${q}%` } },
      ];
    }
    const orders = await TakeawayDeliveryOrder.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json({ orders });
  } catch (error) {
    console.error('Get takeaway orders error:', error);
    res.status(500).json({ message: 'Failed to load orders', error: error.message });
  }
});

router.post('/:hotelId/takeaway-orders', getHotelContext, [body('items').isArray({ min: 1 }).withMessage('At least one item is required')], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    const { TakeawayDeliveryOrder } = req.hotelModels;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await TakeawayDeliveryOrder.count({ where: { trackingId: { [Op.like]: `TD-${dateStr}-%` } } });
    const trackingId = `TD-${dateStr}-${String(count + 1).padStart(4, '0')}`;
    const payload = {
      trackingId,
      orderType: req.body.orderType === 'Takeaway' ? 'Takeaway' : 'Delivery',
      customerId: req.body.customerId || null,
      customerName: req.body.customerName != null ? String(req.body.customerName).trim() : null,
      customerPhone: req.body.customerPhone != null ? String(req.body.customerPhone).trim() : null,
      deliveryPartnerId: req.body.deliveryPartnerId || null,
      status: ['Placed', 'Packed', 'OutForDelivery', 'Delivered', 'Cancelled'].includes(req.body.status) ? req.body.status : 'Placed',
      paymentStatus: ['Paid', 'Pending', 'Failed'].includes(req.body.paymentStatus) ? req.body.paymentStatus : 'Pending',
      paymentMode: req.body.paymentMode === 'Online' ? 'Online' : 'COD',
      items: Array.isArray(req.body.items) ? req.body.items : [],
      deliveryAddress: req.body.deliveryAddress != null ? String(req.body.deliveryAddress).trim() : null,
      pincode: req.body.pincode != null ? String(req.body.pincode).trim() : null,
      deliveryCharges: req.body.deliveryCharges != null ? Number(req.body.deliveryCharges) : 0,
      subtotal: req.body.subtotal != null ? Number(req.body.subtotal) : 0,
      totalAmount: req.body.totalAmount != null ? Number(req.body.totalAmount) : 0,
      source: req.body.source === 'online' ? 'online' : 'manual',
      specialInstructions: req.body.specialInstructions != null ? String(req.body.specialInstructions).trim() : null,
      notes: req.body.notes != null ? String(req.body.notes).trim() : null,
    };
    const order = await TakeawayDeliveryOrder.create(payload);
    res.status(201).json({ order: order.toJSON() });
  } catch (error) {
    console.error('Create takeaway order error:', error);
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
});

router.put('/:hotelId/takeaway-orders/:id', getHotelContext, async (req, res) => {
  try {
    const { TakeawayDeliveryOrder } = req.hotelModels;
    const order = await TakeawayDeliveryOrder.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const fields = ['status', 'paymentStatus', 'paymentMode', 'deliveryPartnerId', 'deliveryAddress', 'pincode', 'deliveryCharges', 'subtotal', 'totalAmount', 'items', 'specialInstructions', 'notes', 'customerName', 'customerPhone'];
    fields.forEach((f) => {
      if (req.body[f] === undefined) return;
      if (['deliveryCharges', 'subtotal', 'totalAmount'].includes(f)) order[f] = Number(req.body[f]) || 0;
      else if (f === 'items') order[f] = Array.isArray(req.body.items) ? req.body.items : [];
      else if (f === 'deliveryPartnerId') order[f] = req.body.deliveryPartnerId || null;
      else order[f] = req.body[f] != null ? String(req.body[f]).trim() : null;
    });
    if (req.body.status && ['Placed', 'Packed', 'OutForDelivery', 'Delivered', 'Cancelled'].includes(req.body.status)) order.status = req.body.status;
    if (req.body.paymentStatus && ['Paid', 'Pending', 'Failed'].includes(req.body.paymentStatus)) order.paymentStatus = req.body.paymentStatus;
    if (req.body.paymentMode && ['COD', 'Online'].includes(req.body.paymentMode)) order.paymentMode = req.body.paymentMode;
    await order.save();
    res.json({ order: order.toJSON() });
  } catch (error) {
    console.error('Update takeaway order error:', error);
    res.status(500).json({ message: 'Failed to update order', error: error.message });
  }
});

router.delete('/:hotelId/takeaway-orders/:id', getHotelContext, async (req, res) => {
  try {
    const { TakeawayDeliveryOrder } = req.hotelModels;
    const order = await TakeawayDeliveryOrder.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    await order.destroy();
    res.json({ message: 'Order deleted' });
  } catch (error) {
    console.error('Delete takeaway order error:', error);
    res.status(500).json({ message: 'Failed to delete order', error: error.message });
  }
});

router.get('/:hotelId/delivery-areas', getHotelContext, async (req, res) => {
  try {
    const { DeliveryArea } = req.hotelModels;
    const where = {};
    if (req.query.isActive !== undefined) where.isActive = req.query.isActive === 'true';
    const areas = await DeliveryArea.findAll({ where, order: [['pincode', 'ASC'], ['zoneName', 'ASC']] });
    res.json({ areas });
  } catch (error) {
    console.error('Get delivery areas error:', error);
    res.status(500).json({ message: 'Failed to load delivery areas', error: error.message });
  }
});

router.post('/:hotelId/delivery-areas', getHotelContext, async (req, res) => {
  try {
    const { DeliveryArea } = req.hotelModels;
    const payload = {
      pincode: req.body.pincode != null ? String(req.body.pincode).trim() : null,
      zoneName: req.body.zoneName != null ? String(req.body.zoneName).trim() : null,
      isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : true,
      notes: req.body.notes != null ? String(req.body.notes).trim() : null,
    };
    const area = await DeliveryArea.create(payload);
    res.status(201).json({ area: area.toJSON() });
  } catch (error) {
    console.error('Create delivery area error:', error);
    res.status(500).json({ message: 'Failed to create delivery area', error: error.message });
  }
});

router.put('/:hotelId/delivery-areas/:id', getHotelContext, async (req, res) => {
  try {
    const { DeliveryArea } = req.hotelModels;
    const area = await DeliveryArea.findByPk(req.params.id);
    if (!area) return res.status(404).json({ message: 'Delivery area not found' });
    if (req.body.pincode !== undefined) area.pincode = req.body.pincode != null ? String(req.body.pincode).trim() : null;
    if (req.body.zoneName !== undefined) area.zoneName = req.body.zoneName != null ? String(req.body.zoneName).trim() : null;
    if (req.body.isActive !== undefined) area.isActive = Boolean(req.body.isActive);
    if (req.body.notes !== undefined) area.notes = req.body.notes != null ? String(req.body.notes).trim() : null;
    await area.save();
    res.json({ area: area.toJSON() });
  } catch (error) {
    console.error('Update delivery area error:', error);
    res.status(500).json({ message: 'Failed to update delivery area', error: error.message });
  }
});

router.delete('/:hotelId/delivery-areas/:id', getHotelContext, async (req, res) => {
  try {
    const { DeliveryArea } = req.hotelModels;
    const area = await DeliveryArea.findByPk(req.params.id);
    if (!area) return res.status(404).json({ message: 'Delivery area not found' });
    await area.destroy();
    res.json({ message: 'Delivery area deleted' });
  } catch (error) {
    console.error('Delete delivery area error:', error);
    res.status(500).json({ message: 'Failed to delete delivery area', error: error.message });
  }
});

router.get('/:hotelId/delivery-charges', getHotelContext, async (req, res) => {
  try {
    const { DeliveryChargesConfig } = req.hotelModels;
    const configs = await DeliveryChargesConfig.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ configs });
  } catch (error) {
    console.error('Get delivery charges error:', error);
    res.status(500).json({ message: 'Failed to load delivery charges', error: error.message });
  }
});

router.post('/:hotelId/delivery-charges', getHotelContext, async (req, res) => {
  try {
    const { DeliveryChargesConfig } = req.hotelModels;
    const payload = {
      chargeType: req.body.chargeType === 'distance' ? 'distance' : 'fixed',
      fixedAmount: req.body.fixedAmount != null ? Number(req.body.fixedAmount) : 0,
      perKmRate: req.body.perKmRate != null ? Number(req.body.perKmRate) : null,
      freeDeliveryAbove: req.body.freeDeliveryAbove != null ? Number(req.body.freeDeliveryAbove) : null,
      isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : true,
      notes: req.body.notes != null ? String(req.body.notes).trim() : null,
    };
    const config = await DeliveryChargesConfig.create(payload);
    res.status(201).json({ config: config.toJSON() });
  } catch (error) {
    console.error('Create delivery charges error:', error);
    res.status(500).json({ message: 'Failed to create delivery charges', error: error.message });
  }
});

router.put('/:hotelId/delivery-charges/:id', getHotelContext, async (req, res) => {
  try {
    const { DeliveryChargesConfig } = req.hotelModels;
    const config = await DeliveryChargesConfig.findByPk(req.params.id);
    if (!config) return res.status(404).json({ message: 'Delivery charges config not found' });
    if (req.body.chargeType !== undefined) config.chargeType = req.body.chargeType === 'distance' ? 'distance' : 'fixed';
    if (req.body.fixedAmount !== undefined) config.fixedAmount = Number(req.body.fixedAmount) || 0;
    if (req.body.perKmRate !== undefined) config.perKmRate = req.body.perKmRate != null ? Number(req.body.perKmRate) : null;
    if (req.body.freeDeliveryAbove !== undefined) config.freeDeliveryAbove = req.body.freeDeliveryAbove != null ? Number(req.body.freeDeliveryAbove) : null;
    if (req.body.isActive !== undefined) config.isActive = Boolean(req.body.isActive);
    if (req.body.notes !== undefined) config.notes = req.body.notes != null ? String(req.body.notes).trim() : null;
    await config.save();
    res.json({ config: config.toJSON() });
  } catch (error) {
    console.error('Update delivery charges error:', error);
    res.status(500).json({ message: 'Failed to update delivery charges', error: error.message });
  }
});

router.get('/:hotelId/takeaway-notifications', getHotelContext, async (req, res) => {
  try {
    const { TakeawayNotificationLog } = req.hotelModels;
    const where = {};
    if (req.query.orderId) where.orderId = req.query.orderId;
    if (req.query.trackingId) where.trackingId = req.query.trackingId;
    const logs = await TakeawayNotificationLog.findAll({ where, order: [['createdAt', 'DESC']], limit: 100 });
    res.json({ logs });
  } catch (error) {
    console.error('Get takeaway notifications error:', error);
    res.status(500).json({ message: 'Failed to load notifications', error: error.message });
  }
});

router.post(
  '/:hotelId/takeaway-notifications',
  getHotelContext,
  [body('channel').isIn(['SMS', 'WhatsApp']).withMessage('Channel must be SMS or WhatsApp')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }
      const { TakeawayNotificationLog } = req.hotelModels;
      const payload = {
        orderId: req.body.orderId || null,
        trackingId: req.body.trackingId != null ? String(req.body.trackingId).trim() : null,
        channel: req.body.channel,
        recipient: req.body.recipient != null ? String(req.body.recipient).trim() : null,
        message: req.body.message != null ? String(req.body.message).trim() : null,
        status: ['Sent', 'Failed', 'Pending'].includes(req.body.status) ? req.body.status : 'Sent',
        notes: req.body.notes != null ? String(req.body.notes).trim() : null,
      };
      const log = await TakeawayNotificationLog.create(payload);
      res.status(201).json({ log: log.toJSON() });
    } catch (error) {
      console.error('Create takeaway notification error:', error);
      res.status(500).json({ message: 'Failed to log notification', error: error.message });
    }
  },
);

// ==================== HAPPY HOUR PRICING ====================

/**
 * @route   GET /api/hotel-data/:hotelId/happy-hour-pricing
 * @desc    List happy hour pricing rules (optional filters: isActive, barOnly)
 * @access  Private
 */
router.get('/:hotelId/happy-hour-pricing', getHotelContext, async (req, res) => {
  try {
    const { HappyHourPricingRule } = req.hotelModels;
    const where = {};
    if (req.query.isActive !== undefined) {
      where.isActive = req.query.isActive === 'true';
    }
    if (req.query.barOnly !== undefined) {
      where.barOnly = req.query.barOnly === 'true';
    }
    const rules = await HappyHourPricingRule.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
    res.json({ rules });
  } catch (error) {
    console.error('Get happy hour pricing rules error:', error);
    res
      .status(500)
      .json({ message: 'Failed to load happy hour pricing rules', error: error.message });
  }
});

/**
 * @route   POST /api/hotel-data/:hotelId/happy-hour-pricing
 * @desc    Create a happy hour pricing rule
 * @access  Private
 */
router.post(
  '/:hotelId/happy-hour-pricing',
  getHotelContext,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('startTime').trim().notEmpty().withMessage('Start time is required'),
    body('endTime').trim().notEmpty().withMessage('End time is required'),
    body('discountType').optional().isIn(['percent', 'fixed']),
    body('discountValue').optional().custom((value) => {
      if (value == null || isNaN(Number(value)) || Number(value) < 0) {
        throw new Error('discountValue must be a non-negative number');
      }
      return true;
    }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { HappyHourPricingRule } = req.hotelModels;

      let daysOfWeek = [];
      if (Array.isArray(req.body.daysOfWeek)) {
        daysOfWeek = req.body.daysOfWeek.map((d) => String(d));
      } else if (typeof req.body.daysOfWeek === 'string' && req.body.daysOfWeek.trim()) {
        daysOfWeek = req.body.daysOfWeek
          .split(',')
          .map((d) => d.trim())
          .filter(Boolean);
      }

      const slots = Array.isArray(req.body.slots) ? req.body.slots : [];
      const productIds = Array.isArray(req.body.productIds)
        ? req.body.productIds.map((id) => String(id))
        : [];

      const payload = {
        name: String(req.body.name || '').trim(),
        description:
          req.body.description != null ? String(req.body.description).trim() : null,
        startTime: String(req.body.startTime || '').trim(),
        endTime: String(req.body.endTime || '').trim(),
        slots,
        daysOfWeek,
        weekendOnly: req.body.weekendOnly !== undefined ? Boolean(req.body.weekendOnly) : false,
        discountType:
          req.body.discountType === 'fixed' || req.body.discountType === 'percent'
            ? req.body.discountType
            : 'percent',
        discountValue:
          req.body.discountValue != null ? Number(req.body.discountValue) : 0,
        productIds,
        barOnly: req.body.barOnly !== undefined ? Boolean(req.body.barOnly) : false,
        autoRevert: req.body.autoRevert !== undefined ? Boolean(req.body.autoRevert) : true,
        autoActivate:
          req.body.autoActivate !== undefined ? Boolean(req.body.autoActivate) : true,
        autoDeactivate:
          req.body.autoDeactivate !== undefined ? Boolean(req.body.autoDeactivate) : true,
        validFrom: req.body.validFrom ? new Date(req.body.validFrom) : null,
        validTo: req.body.validTo ? new Date(req.body.validTo) : null,
        isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : true,
        notes: req.body.notes != null ? String(req.body.notes).trim() : null,
      };

      const rule = await HappyHourPricingRule.create(payload);
      res.status(201).json({ rule: rule.toJSON() });
    } catch (error) {
      console.error('Create happy hour pricing rule error:', error);
      res.status(500).json({
        message: 'Failed to create happy hour pricing rule',
        error: error.message,
      });
    }
  },
);

/**
 * @route   PUT /api/hotel-data/:hotelId/happy-hour-pricing/:id
 * @desc    Update a happy hour pricing rule
 * @access  Private
 */
router.put('/:hotelId/happy-hour-pricing/:id', getHotelContext, async (req, res) => {
  try {
    const { HappyHourPricingRule } = req.hotelModels;
    const rule = await HappyHourPricingRule.findByPk(req.params.id);
    if (!rule) {
      return res.status(404).json({ message: 'Happy hour pricing rule not found' });
    }

    const fields = [
      'name',
      'description',
      'startTime',
      'endTime',
      'discountType',
      'discountValue',
      'weekendOnly',
      'barOnly',
      'autoRevert',
      'autoActivate',
      'autoDeactivate',
      'validFrom',
      'validTo',
      'isActive',
      'notes',
    ];

    fields.forEach((field) => {
      if (req.body[field] === undefined) return;
      if (field === 'discountValue') {
        rule[field] = Number(req.body[field]) || 0;
      } else if (
        field === 'weekendOnly' ||
        field === 'barOnly' ||
        field === 'autoRevert' ||
        field === 'autoActivate' ||
        field === 'autoDeactivate' ||
        field === 'isActive'
      ) {
        rule[field] = Boolean(req.body[field]);
      } else if (field === 'validFrom' || field === 'validTo') {
        rule[field] = req.body[field] ? new Date(req.body[field]) : null;
      } else if (field === 'discountType') {
        if (req.body.discountType === 'fixed' || req.body.discountType === 'percent') {
          rule.discountType = req.body.discountType;
        }
      } else {
        rule[field] =
          req.body[field] != null ? String(req.body[field]).trim() : null;
      }
    });

    if (req.body.daysOfWeek !== undefined) {
      let daysOfWeek = [];
      if (Array.isArray(req.body.daysOfWeek)) {
        daysOfWeek = req.body.daysOfWeek.map((d) => String(d));
      } else if (typeof req.body.daysOfWeek === 'string' && req.body.daysOfWeek.trim()) {
        daysOfWeek = req.body.daysOfWeek
          .split(',')
          .map((d) => d.trim())
          .filter(Boolean);
      }
      rule.daysOfWeek = daysOfWeek;
    }

    if (req.body.slots !== undefined) {
      rule.slots = Array.isArray(req.body.slots) ? req.body.slots : [];
    }

    if (req.body.productIds !== undefined) {
      rule.productIds = Array.isArray(req.body.productIds)
        ? req.body.productIds.map((id) => String(id))
        : [];
    }

    await rule.save();
    res.json({ rule: rule.toJSON() });
  } catch (error) {
    console.error('Update happy hour pricing rule error:', error);
    res.status(500).json({
      message: 'Failed to update happy hour pricing rule',
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/hotel-data/:hotelId/happy-hour-pricing/:id
 * @desc    Delete a happy hour pricing rule
 * @access  Private
 */
router.delete('/:hotelId/happy-hour-pricing/:id', getHotelContext, async (req, res) => {
  try {
    const { HappyHourPricingRule } = req.hotelModels;
    const rule = await HappyHourPricingRule.findByPk(req.params.id);
    if (!rule) {
      return res.status(404).json({ message: 'Happy hour pricing rule not found' });
    }
    await rule.destroy();
    res.json({ message: 'Happy hour pricing rule deleted' });
  } catch (error) {
    console.error('Delete happy hour pricing rule error:', error);
    res.status(500).json({
      message: 'Failed to delete happy hour pricing rule',
      error: error.message,
    });
  }
});

// ==================== INVENTORY MANAGEMENT ====================

/**
 * @route   GET /api/hotel-data/:hotelId/inventory-items
 * @desc    List all inventory items
 * @access  Private
 */
router.get('/:hotelId/inventory-items', getHotelContext, async (req, res) => {
  try {
    const { InventoryItem } = req.hotelModels;
    const where = {};
    if (req.query.isActive !== undefined) {
      where.isActive = req.query.isActive === 'true';
    }
    if (req.query.category) {
      where.category = req.query.category;
    }
    const items = await InventoryItem.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
    res.json({ items });
  } catch (error) {
    console.error('Get inventory items error:', error);
    res.status(500).json({ message: 'Failed to load inventory items', error: error.message });
  }
});

/**
 * @route   POST /api/hotel-data/:hotelId/inventory-items
 * @desc    Create inventory item
 * @access  Private
 */
router.post(
  '/:hotelId/inventory-items',
  getHotelContext,
  [body('name').trim().notEmpty().withMessage('Name is required')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }
      const { InventoryItem } = req.hotelModels;
      
      // Auto-generate SKU if not provided
      let sku = req.body.sku ? String(req.body.sku).trim() : null;
      if (!sku) {
        const prefix = String(req.body.name || 'ITEM').substring(0, 3).toUpperCase();
        const timestamp = Date.now().toString().slice(-6);
        sku = `${prefix}-${timestamp}`;
      }
      
      // Auto-generate barcode if not provided
      let barcode = req.body.barcode ? String(req.body.barcode).trim() : null;
      if (!barcode) {
        barcode = `BC${Date.now()}${Math.floor(Math.random() * 1000)}`;
      }
      
      const payload = {
        name: String(req.body.name || '').trim(),
        sku,
        barcode,
        category: req.body.category != null ? String(req.body.category).trim() : null,
        unit: req.body.unit != null ? String(req.body.unit).trim() : null,
        currentStock: req.body.currentStock != null ? Number(req.body.currentStock) : 0,
        reorderLevel: req.body.reorderLevel != null ? Number(req.body.reorderLevel) : 0,
        costPrice: req.body.costPrice != null ? Number(req.body.costPrice) : 0,
        sellingPrice: req.body.sellingPrice != null ? Number(req.body.sellingPrice) : 0,
        unitPrice: req.body.unitPrice != null ? Number(req.body.unitPrice) : req.body.sellingPrice != null ? Number(req.body.sellingPrice) : 0,
        supplierId: req.body.supplierId || null,
        location: req.body.location != null ? String(req.body.location).trim() : null,
        imageUrl: req.body.imageUrl != null ? String(req.body.imageUrl) : null,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : null,
        batchNumber: req.body.batchNumber != null ? String(req.body.batchNumber).trim() : null,
        notes: req.body.notes != null ? String(req.body.notes).trim() : null,
        isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : true,
      };
      const item = await InventoryItem.create(payload);
      
      // Create initial stock history entry if stock > 0
      if (payload.currentStock > 0) {
        const { StockHistory } = req.hotelModels;
        await StockHistory.create({
          itemId: item.id,
          movementType: 'IN',
          quantity: payload.currentStock,
          previousStock: 0,
          newStock: payload.currentStock,
          referenceType: 'INITIAL',
          notes: 'Initial stock entry',
        });
      }
      res.status(201).json({ item: item.toJSON() });
    } catch (error) {
      console.error('Create inventory item error:', error);
      res.status(500).json({ message: 'Failed to create inventory item', error: error.message });
    }
  }
);

/**
 * @route   PUT /api/hotel-data/:hotelId/inventory-items/:id
 * @desc    Update inventory item
 * @access  Private
 */
router.put('/:hotelId/inventory-items/:id', getHotelContext, async (req, res) => {
  try {
    const { InventoryItem } = req.hotelModels;
    const item = await InventoryItem.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    const oldStock = Number(item.currentStock || 0);
    const fields = [
      'name',
      'sku',
      'barcode',
      'category',
      'unit',
      'currentStock',
      'reorderLevel',
      'costPrice',
      'sellingPrice',
      'unitPrice',
      'supplierId',
      'location',
      'imageUrl',
      'expiryDate',
      'batchNumber',
      'notes',
      'isActive',
    ];
    fields.forEach((field) => {
      if (req.body[field] === undefined) return;
      if (field === 'currentStock' || field === 'reorderLevel' || field === 'costPrice' || field === 'sellingPrice' || field === 'unitPrice') {
        item[field] = Number(req.body[field] || 0);
      } else if (field === 'isActive') {
        item[field] = Boolean(req.body[field]);
      } else if (field === 'expiryDate') {
        item[field] = req.body[field] ? new Date(req.body[field]) : null;
      } else if (field === 'name' || field === 'sku' || field === 'barcode') {
        item[field] = String(req.body[field] || '').trim();
      } else if (field === 'supplierId') {
        item[field] = req.body[field] || null;
      } else if (field === 'imageUrl') {
        item[field] = req.body[field] != null ? String(req.body[field]) : null;
      } else {
        item[field] = req.body[field] != null ? String(req.body[field]).trim() : null;
      }
    });

    await item.save();
    
    // Create stock history entry if stock changed
    const newStock = Number(item.currentStock || 0);
    if (oldStock !== newStock) {
      const { StockHistory } = req.hotelModels;
      await StockHistory.create({
        itemId: item.id,
        movementType: newStock > oldStock ? 'IN' : 'OUT',
        quantity: Math.abs(newStock - oldStock),
        previousStock: oldStock,
        newStock,
        referenceType: 'ADJUSTMENT',
        notes: req.body.stockChangeNote || 'Stock adjustment',
      });
    }
    
    res.json({ item: item.toJSON() });
  } catch (error) {
    console.error('Update inventory item error:', error);
    res.status(500).json({ message: 'Failed to update inventory item', error: error.message });
  }
});

/**
 * @route   DELETE /api/hotel-data/:hotelId/inventory-items/:id
 * @desc    Delete inventory item
 * @access  Private
 */
router.delete('/:hotelId/inventory-items/:id', getHotelContext, async (req, res) => {
  try {
    const { InventoryItem } = req.hotelModels;
    const item = await InventoryItem.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    await item.destroy();
    res.json({ message: 'Inventory item deleted' });
  } catch (error) {
    console.error('Delete inventory item error:', error);
    res.status(500).json({ message: 'Failed to delete inventory item', error: error.message });
  }
});

/**
 * @route   GET /api/hotel-data/:hotelId/stock-history
 * @desc    Get stock history (optional: itemId filter)
 * @access  Private
 */
router.get('/:hotelId/stock-history', getHotelContext, async (req, res) => {
  try {
    const { StockHistory } = req.hotelModels;
    const where = {};
    if (req.query.itemId) {
      where.itemId = req.query.itemId;
    }
    const history = await StockHistory.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: req.query.limit ? parseInt(req.query.limit) : 100,
    });
    res.json({ history });
  } catch (error) {
    console.error('Get stock history error:', error);
    res.status(500).json({ message: 'Failed to load stock history', error: error.message });
  }
});

/**
 * @route   POST /api/hotel-data/:hotelId/stock-history
 * @desc    Create stock history entry
 * @access  Private
 */
router.post('/:hotelId/stock-history', getHotelContext, async (req, res) => {
  try {
    const { StockHistory, InventoryItem } = req.hotelModels;
    const item = await InventoryItem.findByPk(req.body.itemId);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    const previousStock = Number(item.currentStock || 0);
    const quantity = Number(req.body.quantity || 0);
    const movementType = String(req.body.movementType || 'IN').toUpperCase();
    
    let newStock = previousStock;
    if (movementType === 'IN') {
      newStock = previousStock + quantity;
    } else if (movementType === 'OUT') {
      newStock = Math.max(0, previousStock - quantity);
    } else if (movementType === 'ADJUSTMENT') {
      newStock = quantity;
    }

    item.currentStock = newStock;
    await item.save();

    const history = await StockHistory.create({
      itemId: item.id,
      movementType,
      quantity,
      previousStock,
      newStock,
      referenceType: req.body.referenceType || null,
      referenceId: req.body.referenceId || null,
      notes: req.body.notes || null,
      performedBy: req.body.performedBy || null,
    });

    res.status(201).json({ history: history.toJSON(), item: item.toJSON() });
  } catch (error) {
    console.error('Create stock history error:', error);
    res.status(500).json({ message: 'Failed to create stock history', error: error.message });
  }
});

/**
 * @route   GET /api/hotel-data/:hotelId/suppliers
 * @desc    List all suppliers
 * @access  Private
 */
router.get('/:hotelId/suppliers', getHotelContext, async (req, res) => {
  try {
    const { Supplier } = req.hotelModels;
    
    // Sync table to ensure all columns exist
    try {
      await Supplier.sync({ alter: true });
    } catch (syncError) {
      console.warn('Supplier sync warning (non-fatal):', syncError.message);
    }
    
    const where = {};
    if (req.query.isActive !== undefined) {
      where.isActive = req.query.isActive === 'true';
    }
    const suppliers = await Supplier.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
    
    // Map to ensure all fields have defaults
    const suppliersData = suppliers.map((s) => {
      const json = s.toJSON ? s.toJSON() : s;
      return {
        id: json.id,
        name: json.name || '',
        contactPerson: json.contactPerson || null,
        email: json.email || null,
        phone: json.phone || null,
        address: json.address || null,
        paymentTerms: json.paymentTerms || null,
        gstNumber: json.gstNumber || null,
        bankName: json.bankName || null,
        bankAccountNumber: json.bankAccountNumber || null,
        bankIFSC: json.bankIFSC || null,
        bankBranch: json.bankBranch || null,
        rating: json.rating != null ? Number(json.rating) : null,
        totalPurchases: json.totalPurchases != null ? Number(json.totalPurchases) : 0,
        outstandingAmount: json.outstandingAmount != null ? Number(json.outstandingAmount) : 0,
        notes: json.notes || null,
        isActive: json.isActive !== false,
        createdAt: json.createdAt || new Date(),
        updatedAt: json.updatedAt || new Date(),
      };
    });
    
    res.json({ suppliers: suppliersData });
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ message: 'Failed to load suppliers', error: error.message });
  }
});

/**
 * @route   POST /api/hotel-data/:hotelId/suppliers
 * @desc    Create supplier
 * @access  Private
 */
router.post(
  '/:hotelId/suppliers',
  getHotelContext,
  [body('name').trim().notEmpty().withMessage('Supplier name is required')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }
      const { Supplier } = req.hotelModels;
      const payload = {
        name: String(req.body.name || '').trim(),
        contactPerson: req.body.contactPerson != null ? String(req.body.contactPerson).trim() : null,
        email: req.body.email != null ? String(req.body.email).trim() : null,
        phone: req.body.phone != null ? String(req.body.phone).trim() : null,
        address: req.body.address != null ? String(req.body.address).trim() : null,
        paymentTerms: req.body.paymentTerms != null ? String(req.body.paymentTerms).trim() : null,
        gstNumber: req.body.gstNumber != null ? String(req.body.gstNumber).trim() : null,
        bankName: req.body.bankName != null ? String(req.body.bankName).trim() : null,
        bankAccountNumber: req.body.bankAccountNumber != null ? String(req.body.bankAccountNumber).trim() : null,
        bankIFSC: req.body.bankIFSC != null ? String(req.body.bankIFSC).trim() : null,
        bankBranch: req.body.bankBranch != null ? String(req.body.bankBranch).trim() : null,
        rating: req.body.rating != null ? Number(req.body.rating) : null,
        totalPurchases: 0,
        outstandingAmount: 0,
        notes: req.body.notes != null ? String(req.body.notes).trim() : null,
        isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : true,
      };
      const supplier = await Supplier.create(payload);
      res.status(201).json({ supplier: supplier.toJSON() });
    } catch (error) {
      console.error('Create supplier error:', error);
      res.status(500).json({ message: 'Failed to create supplier', error: error.message });
    }
  }
);

/**
 * @route   PUT /api/hotel-data/:hotelId/suppliers/:id
 * @desc    Update supplier
 * @access  Private
 */
router.put('/:hotelId/suppliers/:id', getHotelContext, async (req, res) => {
  try {
    const { Supplier } = req.hotelModels;
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    const fields = [
      'name',
      'contactPerson',
      'email',
      'phone',
      'address',
      'paymentTerms',
      'gstNumber',
      'bankName',
      'bankAccountNumber',
      'bankIFSC',
      'bankBranch',
      'rating',
      'notes',
      'isActive',
    ];
    fields.forEach((field) => {
      if (req.body[field] === undefined) return;
      if (field === 'rating') {
        supplier.rating = req.body.rating != null ? Number(req.body.rating) : null;
      } else if (field === 'isActive') {
        supplier.isActive = Boolean(req.body.isActive);
      } else if (field === 'name') {
        supplier.name = String(req.body.name || '').trim();
      } else {
        supplier[field] = req.body[field] != null ? String(req.body[field]).trim() : null;
      }
    });

    await supplier.save();
    res.json({ supplier: supplier.toJSON() });
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({ message: 'Failed to update supplier', error: error.message });
  }
});

/**
 * @route   DELETE /api/hotel-data/:hotelId/suppliers/:id
 * @desc    Delete supplier
 * @access  Private
 */
router.delete('/:hotelId/suppliers/:id', getHotelContext, async (req, res) => {
  try {
    const { Supplier, PurchaseOrder } = req.hotelModels;
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    // Check if supplier has purchase orders
    const ordersCount = await PurchaseOrder.count({ where: { supplierId: supplier.id } });
    if (ordersCount > 0) {
      return res.status(409).json({
        message: `Cannot delete supplier. ${ordersCount} purchase order(s) are associated with this supplier.`,
      });
    }

    await supplier.destroy();
    res.json({ message: 'Supplier deleted' });
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({ message: 'Failed to delete supplier', error: error.message });
  }
});

/**
 * @route   GET /api/hotel-data/:hotelId/suppliers/:id/purchase-history
 * @desc    Get purchase history for a supplier
 * @access  Private
 */
router.get('/:hotelId/suppliers/:id/purchase-history', getHotelContext, async (req, res) => {
  try {
    const { PurchaseOrder } = req.hotelModels;
    const orders = await PurchaseOrder.findAll({
      where: { supplierId: req.params.id },
      order: [['createdAt', 'DESC']],
    });
    res.json({ orders });
  } catch (error) {
    console.error('Get supplier purchase history error:', error);
    res.status(500).json({ message: 'Failed to load purchase history', error: error.message });
  }
});

/**
 * @route   GET /api/hotel-data/:hotelId/suppliers/:id/outstanding-payments
 * @desc    Get outstanding payments for a supplier
 * @access  Private
 */
router.get('/:hotelId/suppliers/:id/outstanding-payments', getHotelContext, async (req, res) => {
  try {
    const { PurchaseOrder } = req.hotelModels;
    const orders = await PurchaseOrder.findAll({
      where: {
        supplierId: req.params.id,
        status: { [Op.in]: ['Approved', 'Ordered', 'Received'] },
      },
    });
    
    // Calculate outstanding (simplified - in production, track actual payments)
    const outstanding = orders.reduce((sum, order) => {
      return sum + Number(order.totalAmount || 0);
    }, 0);
    
    res.json({ outstandingAmount: outstanding, orders });
  } catch (error) {
    console.error('Get outstanding payments error:', error);
    res.status(500).json({ message: 'Failed to load outstanding payments', error: error.message });
  }
});

/**
 * @route   GET /api/hotel-data/:hotelId/purchase-orders
 * @desc    List purchase orders (optional filter: status)
 * @access  Private
 */
router.get('/:hotelId/purchase-orders', getHotelContext, async (req, res) => {
  try {
    const { PurchaseOrder } = req.hotelModels;
    
    // First, try to sync the table to ensure all columns exist
    try {
      await PurchaseOrder.sync({ alter: true });
    } catch (syncError) {
      console.warn('PurchaseOrder sync warning (non-fatal):', syncError.message);
    }
    
    const where = {};
    if (req.query.status) {
      where.status = req.query.status;
    }
    
    const orders = await PurchaseOrder.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
    
    // Map to JSON and ensure all fields have defaults for backward compatibility
    const ordersData = orders.map((order) => {
      const json = order.toJSON ? order.toJSON() : order;
      return {
        id: json.id,
        orderNumber: json.orderNumber || '',
        supplierId: json.supplierId || null,
        orderDate: json.orderDate || new Date(),
        expectedDeliveryDate: json.expectedDeliveryDate || null,
        status: json.status || 'Draft',
        items: Array.isArray(json.items) ? json.items : [],
        subtotal: json.subtotal != null ? Number(json.subtotal) : (json.totalAmount != null ? Number(json.totalAmount) : 0),
        taxRate: json.taxRate != null ? Number(json.taxRate) : 0,
        taxAmount: json.taxAmount != null ? Number(json.taxAmount) : 0,
        totalAmount: json.totalAmount != null ? Number(json.totalAmount) : (json.subtotal != null ? Number(json.subtotal) : 0),
        receivedItems: Array.isArray(json.receivedItems) ? json.receivedItems : [],
        approvedBy: json.approvedBy || null,
        approvedAt: json.approvedAt || null,
        notes: json.notes || null,
        createdAt: json.createdAt || new Date(),
        updatedAt: json.updatedAt || new Date(),
      };
    });
    
    res.json({ orders: ordersData });
  } catch (error) {
    console.error('Get purchase orders error:', error);
    console.error('Error stack:', error.stack);
    
    // Check if it's a column error
    if (error.message && (error.message.includes('column') || error.message.includes('does not exist'))) {
      return res.status(500).json({ 
        message: 'Purchase order table needs to be synced. Please restart the backend server to update the database schema.',
        error: error.message,
        hint: 'The purchase_orders table is missing some columns. Restarting the backend will automatically add them.'
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to load purchase orders', 
      error: error.message
    });
  }
});

/**
 * @route   POST /api/hotel-data/:hotelId/purchase-orders
 * @desc    Create purchase order
 * @access  Private
 */
router.post(
  '/:hotelId/purchase-orders',
  getHotelContext,
  [body('supplierId').notEmpty().withMessage('Supplier is required')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }
      const { PurchaseOrder } = req.hotelModels;
      
      // Auto-generate PO number
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const count = await PurchaseOrder.count({ where: { orderNumber: { [Op.like]: `PO-${year}${month}-%` } } });
      const orderNumber = `PO-${year}${month}-${String(count + 1).padStart(4, '0')}`;
      
      const items = Array.isArray(req.body.items) ? req.body.items : [];
      const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.price || 0)), 0);
      const taxRate = Number(req.body.taxRate || 0);
      const taxAmount = (subtotal * taxRate) / 100;
      const totalAmount = subtotal + taxAmount;
      
      const payload = {
        orderNumber,
        supplierId: req.body.supplierId,
        orderDate: req.body.orderDate ? new Date(req.body.orderDate) : new Date(),
        expectedDeliveryDate: req.body.expectedDeliveryDate ? new Date(req.body.expectedDeliveryDate) : null,
        status: req.body.status || 'Draft',
        items,
        subtotal,
        taxRate,
        taxAmount,
        totalAmount,
        receivedItems: [],
        approvedBy: null,
        approvedAt: null,
        notes: req.body.notes != null ? String(req.body.notes).trim() : null,
      };
      
      const order = await PurchaseOrder.create(payload);
      res.status(201).json({ order: order.toJSON() });
    } catch (error) {
      console.error('Create purchase order error:', error);
      res.status(500).json({ message: 'Failed to create purchase order', error: error.message });
    }
  }
);

/**
 * @route   PUT /api/hotel-data/:hotelId/purchase-orders/:id
 * @desc    Update purchase order
 * @access  Private
 */
router.put('/:hotelId/purchase-orders/:id', getHotelContext, async (req, res) => {
  try {
    const { PurchaseOrder } = req.hotelModels;
    const order = await PurchaseOrder.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    // Can't edit if already received or cancelled
    if (order.status === 'Received' || order.status === 'Cancelled') {
      return res.status(400).json({ message: 'Cannot edit a received or cancelled order' });
    }

    const fields = ['supplierId', 'orderDate', 'expectedDeliveryDate', 'status', 'items', 'taxRate', 'notes', 'receivedItems'];
    fields.forEach((field) => {
      if (req.body[field] === undefined) return;
      if (field === 'items' || field === 'receivedItems') {
        order[field] = Array.isArray(req.body[field]) ? req.body[field] : [];
      } else if (field === 'orderDate' || field === 'expectedDeliveryDate') {
        order[field] = req.body[field] ? new Date(req.body[field]) : null;
      } else if (field === 'taxRate') {
        order.taxRate = Number(req.body.taxRate || 0);
      } else if (field === 'status') {
        order.status = req.body.status;
      } else if (field === 'supplierId') {
        order.supplierId = req.body.supplierId;
      } else {
        order[field] = req.body[field] != null ? String(req.body[field]).trim() : null;
      }
    });

    // Recalculate totals
    const items = Array.isArray(order.items) ? order.items : [];
    order.subtotal = items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.price || 0)), 0);
    order.taxAmount = (order.subtotal * order.taxRate) / 100;
    order.totalAmount = order.subtotal + order.taxAmount;

    await order.save();
    res.json({ order: order.toJSON() });
  } catch (error) {
    console.error('Update purchase order error:', error);
    res.status(500).json({ message: 'Failed to update purchase order', error: error.message });
  }
});

/**
 * @route   PUT /api/hotel-data/:hotelId/purchase-orders/:id/approve
 * @desc    Approve purchase order
 * @access  Private
 */
router.put('/:hotelId/purchase-orders/:id/approve', getHotelContext, async (req, res) => {
  try {
    const { PurchaseOrder } = req.hotelModels;
    const order = await PurchaseOrder.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    if (order.status !== 'Draft' && order.status !== 'Pending') {
      return res.status(400).json({ message: 'Only Draft or Pending orders can be approved' });
    }

    order.status = 'Approved';
    order.approvedBy = req.user?.id || null;
    order.approvedAt = new Date();
    await order.save();

    res.json({ order: order.toJSON() });
  } catch (error) {
    console.error('Approve purchase order error:', error);
    res.status(500).json({ message: 'Failed to approve purchase order', error: error.message });
  }
});

/**
 * @route   PUT /api/hotel-data/:hotelId/purchase-orders/:id/receive
 * @desc    Mark purchase order as received (supports partial delivery)
 * @access  Private
 */
router.put('/:hotelId/purchase-orders/:id/receive', getHotelContext, async (req, res) => {
  try {
    const { PurchaseOrder, InventoryItem, StockHistory } = req.hotelModels;
    const order = await PurchaseOrder.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    const receivedItems = Array.isArray(req.body.receivedItems) ? req.body.receivedItems : order.items;
    order.receivedItems = receivedItems;

    // Check if all items received
    const allReceived = order.items.every((item) => {
      const received = receivedItems.find((r) => r.itemId === item.itemId || r.name === item.name);
      return received && Number(received.quantityReceived || 0) >= Number(item.quantity || 0);
    });

    if (allReceived) {
      order.status = 'Received';
    } else {
      order.status = 'Ordered'; // Partial delivery
    }

    await order.save();

    // Update inventory items and create stock history
    for (const received of receivedItems) {
      const itemId = received.itemId;
      if (!itemId) continue;

      const item = await InventoryItem.findByPk(itemId);
      if (item) {
        const qtyReceived = Number(received.quantityReceived || 0);
        const oldStock = Number(item.currentStock || 0);
        item.currentStock = oldStock + qtyReceived;
        await item.save();

        await StockHistory.create({
          itemId: item.id,
          movementType: 'IN',
          quantity: qtyReceived,
          previousStock: oldStock,
          newStock: item.currentStock,
          referenceType: 'PURCHASE_ORDER',
          referenceId: order.id,
          notes: `Received from PO ${order.orderNumber}`,
        });
      }
    }

    res.json({ order: order.toJSON() });
  } catch (error) {
    console.error('Receive purchase order error:', error);
    res.status(500).json({ message: 'Failed to receive purchase order', error: error.message });
  }
});

/**
 * @route   DELETE /api/hotel-data/:hotelId/purchase-orders/:id
 * @desc    Cancel purchase order
 * @access  Private
 */
router.delete('/:hotelId/purchase-orders/:id', getHotelContext, async (req, res) => {
  try {
    const { PurchaseOrder } = req.hotelModels;
    const order = await PurchaseOrder.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    if (order.status === 'Received') {
      return res.status(400).json({ message: 'Cannot cancel a received order' });
    }

    order.status = 'Cancelled';
    await order.save();

    res.json({ message: 'Purchase order cancelled', order: order.toJSON() });
  } catch (error) {
    console.error('Cancel purchase order error:', error);
    res.status(500).json({ message: 'Failed to cancel purchase order', error: error.message });
  }
});

// ==================== GRN (GOODS RECEIPT NOTE) ====================

/**
 * @route   GET /api/hotel-data/:hotelId/grns
 * @desc    List all GRNs (optional filter: status, purchaseOrderId)
 * @access  Private
 */
router.get('/:hotelId/grns', getHotelContext, async (req, res) => {
  try {
    const { GRN } = req.hotelModels;
    
    // Sync table to ensure all columns exist
    try {
      await GRN.sync({ alter: true });
    } catch (syncError) {
      console.warn('GRN sync warning (non-fatal):', syncError.message);
    }
    
    const where = {};
    if (req.query.status) {
      where.status = req.query.status;
    }
    if (req.query.purchaseOrderId) {
      where.purchaseOrderId = req.query.purchaseOrderId;
    }
    
    const grns = await GRN.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
    
    const grnsData = grns.map((grn) => {
      const json = grn.toJSON ? grn.toJSON() : grn;
      return {
        id: json.id,
        grnNumber: json.grnNumber || '',
        purchaseOrderId: json.purchaseOrderId || null,
        supplierId: json.supplierId || null,
        receivedDate: json.receivedDate || new Date(),
        status: json.status || 'Draft',
        receivedItems: Array.isArray(json.receivedItems) ? json.receivedItems : [],
        totalItems: json.totalItems || 0,
        totalAcceptedItems: json.totalAcceptedItems || 0,
        totalRejectedItems: json.totalRejectedItems || 0,
        totalAmount: json.totalAmount != null ? Number(json.totalAmount) : 0,
        verifiedBy: json.verifiedBy || null,
        verifiedAt: json.verifiedAt || null,
        approvedBy: json.approvedBy || null,
        approvedAt: json.approvedAt || null,
        stockUpdated: json.stockUpdated || false,
        stockUpdatedAt: json.stockUpdatedAt || null,
        notes: json.notes || null,
        createdAt: json.createdAt || new Date(),
        updatedAt: json.updatedAt || new Date(),
      };
    });
    
    res.json({ grns: grnsData });
  } catch (error) {
    console.error('Get GRNs error:', error);
    res.status(500).json({ message: 'Failed to load GRNs', error: error.message });
  }
});

/**
 * @route   GET /api/hotel-data/:hotelId/grns/:id
 * @desc    Get single GRN by ID
 * @access  Private
 */
router.get('/:hotelId/grns/:id', getHotelContext, async (req, res) => {
  try {
    const { GRN } = req.hotelModels;
    const grn = await GRN.findByPk(req.params.id);
    if (!grn) {
      return res.status(404).json({ message: 'GRN not found' });
    }
    res.json({ grn: grn.toJSON() });
  } catch (error) {
    console.error('Get GRN error:', error);
    res.status(500).json({ message: 'Failed to load GRN', error: error.message });
  }
});

/**
 * @route   POST /api/hotel-data/:hotelId/grns
 * @desc    Create GRN from Purchase Order
 * @access  Private
 */
router.post('/:hotelId/grns', getHotelContext, async (req, res) => {
  try {
    const { GRN, PurchaseOrder, InventoryItem, StockHistory } = req.hotelModels;
    
    const { purchaseOrderId, receivedItems, notes } = req.body;
    
    if (!purchaseOrderId) {
      return res.status(400).json({ message: 'Purchase Order ID is required' });
    }
    
    // Get the Purchase Order
    const po = await PurchaseOrder.findByPk(purchaseOrderId);
    if (!po) {
      return res.status(404).json({ message: 'Purchase Order not found' });
    }
    
    if (po.status !== 'Approved' && po.status !== 'Ordered') {
      return res.status(400).json({ message: 'Can only create GRN from Approved or Ordered Purchase Orders' });
    }
    
    // Generate GRN number
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const count = await GRN.count({ where: { grnNumber: { [Op.like]: `GRN-${dateStr}-%` } } });
    const grnNumber = `GRN-${dateStr}-${String(count + 1).padStart(4, '0')}`;
    
    // Validate received items
    const poItems = Array.isArray(po.items) ? po.items : [];
    const receivedItemsArray = Array.isArray(receivedItems) ? receivedItems : [];
    
    // Calculate totals
    let totalAmount = 0;
    let totalAcceptedItems = 0;
    let totalRejectedItems = 0;
    
    receivedItemsArray.forEach((item) => {
      const acceptedQty = Number(item.acceptedQty || 0);
      const rejectedQty = Number(item.rejectedQty || 0);
      const unitPrice = Number(item.unitPrice || 0);
      totalAmount += acceptedQty * unitPrice;
      if (acceptedQty > 0) totalAcceptedItems++;
      if (rejectedQty > 0) totalRejectedItems++;
    });
    
    const grn = await GRN.create({
      grnNumber,
      purchaseOrderId,
      supplierId: po.supplierId,
      receivedDate: new Date(),
      status: 'Draft',
      receivedItems: receivedItemsArray,
      totalItems: receivedItemsArray.length,
      totalAcceptedItems,
      totalRejectedItems,
      totalAmount,
      notes: notes || null,
    });
    
    res.status(201).json({ grn: grn.toJSON() });
  } catch (error) {
    console.error('Create GRN error:', error);
    res.status(500).json({ message: 'Failed to create GRN', error: error.message });
  }
});

/**
 * @route   PUT /api/hotel-data/:hotelId/grns/:id
 * @desc    Update GRN (verify, approve, update items)
 * @access  Private
 */
router.put('/:hotelId/grns/:id', getHotelContext, async (req, res) => {
  try {
    const { GRN } = req.hotelModels;
    const grn = await GRN.findByPk(req.params.id);
    if (!grn) {
      return res.status(404).json({ message: 'GRN not found' });
    }
    
    const { status, receivedItems, notes } = req.body;
    
    if (status) {
      grn.status = status;
      if (status === 'Verified') {
        grn.verifiedBy = req.user.id;
        grn.verifiedAt = new Date();
      }
      if (status === 'Approved') {
        grn.approvedBy = req.user.id;
        grn.approvedAt = new Date();
      }
    }
    
    if (receivedItems !== undefined) {
      const receivedItemsArray = Array.isArray(receivedItems) ? receivedItems : [];
      
      // Recalculate totals
      let totalAmount = 0;
      let totalAcceptedItems = 0;
      let totalRejectedItems = 0;
      
      receivedItemsArray.forEach((item) => {
        const acceptedQty = Number(item.acceptedQty || 0);
        const rejectedQty = Number(item.rejectedQty || 0);
        const unitPrice = Number(item.unitPrice || 0);
        totalAmount += acceptedQty * unitPrice;
        if (acceptedQty > 0) totalAcceptedItems++;
        if (rejectedQty > 0) totalRejectedItems++;
      });
      
      grn.receivedItems = receivedItemsArray;
      grn.totalItems = receivedItemsArray.length;
      grn.totalAcceptedItems = totalAcceptedItems;
      grn.totalRejectedItems = totalRejectedItems;
      grn.totalAmount = totalAmount;
    }
    
    if (notes !== undefined) {
      grn.notes = notes;
    }
    
    await grn.save();
    res.json({ grn: grn.toJSON() });
  } catch (error) {
    console.error('Update GRN error:', error);
    res.status(500).json({ message: 'Failed to update GRN', error: error.message });
  }
});

/**
 * @route   PUT /api/hotel-data/:hotelId/grns/:id/approve-and-update-stock
 * @desc    Approve GRN and automatically update inventory stock
 * @access  Private
 */
router.put('/:hotelId/grns/:id/approve-and-update-stock', getHotelContext, async (req, res) => {
  try {
    const { GRN, InventoryItem, StockHistory } = req.hotelModels;
    const grn = await GRN.findByPk(req.params.id);
    if (!grn) {
      return res.status(404).json({ message: 'GRN not found' });
    }
    
    if (grn.status !== 'Verified') {
      return res.status(400).json({ message: 'GRN must be verified before approval' });
    }
    
    if (grn.stockUpdated) {
      return res.status(400).json({ message: 'Stock has already been updated for this GRN' });
    }
    
    const receivedItems = Array.isArray(grn.receivedItems) ? grn.receivedItems : [];
    
    // Update stock for each accepted item
    for (const item of receivedItems) {
      const acceptedQty = Number(item.acceptedQty || 0);
      if (acceptedQty > 0 && item.itemId) {
        const inventoryItem = await InventoryItem.findByPk(item.itemId);
        if (inventoryItem) {
          const oldStock = Number(inventoryItem.currentStock || 0);
          const newStock = oldStock + acceptedQty;
          
          inventoryItem.currentStock = newStock;
          
          // Update batch number and expiry date if provided
          if (item.batchNumber) {
            inventoryItem.batchNumber = item.batchNumber;
          }
          if (item.expiryDate) {
            inventoryItem.expiryDate = new Date(item.expiryDate);
          }
          
          await inventoryItem.save();
          
          // Create stock history entry
          await StockHistory.create({
            itemId: item.itemId,
            movementType: 'In',
            quantity: acceptedQty,
            previousStock: oldStock,
            newStock: newStock,
            referenceType: 'GRN',
            referenceId: grn.id,
            notes: `GRN ${grn.grnNumber} - Received from PO`,
            performedBy: req.user.id,
          });
        }
      }
    }
    
    // Update GRN status
    grn.status = 'Approved';
    grn.approvedBy = req.user.id;
    grn.approvedAt = new Date();
    grn.stockUpdated = true;
    grn.stockUpdatedAt = new Date();
    await grn.save();
    
    res.json({ grn: grn.toJSON(), message: 'GRN approved and stock updated successfully' });
  } catch (error) {
    console.error('Approve GRN and update stock error:', error);
    res.status(500).json({ message: 'Failed to approve GRN and update stock', error: error.message });
  }
});

/**
 * @route   DELETE /api/hotel-data/:hotelId/grns/:id
 * @desc    Delete GRN (only if status is Draft)
 * @access  Private
 */
router.delete('/:hotelId/grns/:id', getHotelContext, async (req, res) => {
  try {
    const { GRN } = req.hotelModels;
    const grn = await GRN.findByPk(req.params.id);
    if (!grn) {
      return res.status(404).json({ message: 'GRN not found' });
    }
    
    if (grn.status !== 'Draft') {
      return res.status(400).json({ message: 'Can only delete GRN with Draft status' });
    }
    
    await grn.destroy();
    res.json({ message: 'GRN deleted successfully' });
  } catch (error) {
    console.error('Delete GRN error:', error);
    res.status(500).json({ message: 'Failed to delete GRN', error: error.message });
  }
});

// ==================== INVENTORY LOCATIONS (STORES) ====================

router.get('/:hotelId/inventory-locations', getHotelContext, async (req, res) => {
  try {
    const { InventoryLocation } = req.hotelModels;
    try { await InventoryLocation.sync({ alter: true }); } catch (e) { console.warn('InventoryLocation sync:', e.message); }
    const where = {};
    if (req.query.isActive === 'true') where.isActive = true;
    const locations = await InventoryLocation.findAll({ where, order: [['name', 'ASC']] });
    res.json({ locations: locations.map((l) => l.toJSON()) });
  } catch (error) {
    console.error('Get inventory locations error:', error);
    res.status(500).json({ message: 'Failed to load locations', error: error.message });
  }
});

router.post('/:hotelId/inventory-locations', getHotelContext, async (req, res) => {
  try {
    const { InventoryLocation } = req.hotelModels;
    const { name, code, description, isActive } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Location name is required' });
    }
    const location = await InventoryLocation.create({
      name: String(name).trim(),
      code: code ? String(code).trim() : null,
      description: description ? String(description).trim() : null,
      isActive: isActive !== false,
    });
    res.status(201).json({ location: location.toJSON() });
  } catch (error) {
    console.error('Create location error:', error);
    res.status(500).json({ message: 'Failed to create location', error: error.message });
  }
});

router.put('/:hotelId/inventory-locations/:id', getHotelContext, async (req, res) => {
  try {
    const { InventoryLocation } = req.hotelModels;
    const location = await InventoryLocation.findByPk(req.params.id);
    if (!location) return res.status(404).json({ message: 'Location not found' });
    const { name, code, description, isActive } = req.body;
    if (name !== undefined) location.name = String(name).trim();
    if (code !== undefined) location.code = code ? String(code).trim() : null;
    if (description !== undefined) location.description = description ? String(description).trim() : null;
    if (isActive !== undefined) location.isActive = !!isActive;
    await location.save();
    res.json({ location: location.toJSON() });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ message: 'Failed to update location', error: error.message });
  }
});

// ==================== ITEM STOCK BY LOCATION ====================

router.get('/:hotelId/item-stock-by-location', getHotelContext, async (req, res) => {
  try {
    const { ItemStockByLocation } = req.hotelModels;
    try { await ItemStockByLocation.sync({ alter: true }); } catch (e) { console.warn('ItemStockByLocation sync:', e.message); }
    const where = {};
    if (req.query.locationId) where.locationId = req.query.locationId;
    if (req.query.itemId) where.itemId = req.query.itemId;
    const rows = await ItemStockByLocation.findAll({ where });
    res.json({ stock: rows.map((r) => r.toJSON()) });
  } catch (error) {
    console.error('Get item stock by location error:', error);
    res.status(500).json({ message: 'Failed to load stock', error: error.message });
  }
});

router.post('/:hotelId/item-stock-by-location', getHotelContext, async (req, res) => {
  try {
    const { ItemStockByLocation } = req.hotelModels;
    const { itemId, locationId, quantity } = req.body;
    if (!itemId || !locationId) {
      return res.status(400).json({ message: 'itemId and locationId are required' });
    }
    const [row, created] = await ItemStockByLocation.findOrCreate({
      where: { itemId, locationId },
      defaults: { quantity: Number(quantity) || 0 },
    });
    if (!created) {
      row.quantity = Number(quantity) ?? row.quantity;
      await row.save();
    }
    res.json({ stock: row.toJSON() });
  } catch (error) {
    console.error('Upsert item stock by location error:', error);
    res.status(500).json({ message: 'Failed to save stock', error: error.message });
  }
});

// ==================== STOCK TRANSFERS ====================

router.get('/:hotelId/stock-transfers', getHotelContext, async (req, res) => {
  try {
    const { StockTransfer } = req.hotelModels;
    try { await StockTransfer.sync({ alter: true }); } catch (e) { console.warn('StockTransfer sync:', e.message); }
    const where = {};
    if (req.query.status) where.status = req.query.status;
    const transfers = await StockTransfer.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json({ transfers: transfers.map((t) => t.toJSON()) });
  } catch (error) {
    console.error('Get stock transfers error:', error);
    res.status(500).json({ message: 'Failed to load transfers', error: error.message });
  }
});

router.get('/:hotelId/stock-transfers/:id', getHotelContext, async (req, res) => {
  try {
    const { StockTransfer } = req.hotelModels;
    const transfer = await StockTransfer.findByPk(req.params.id);
    if (!transfer) return res.status(404).json({ message: 'Transfer not found' });
    res.json({ transfer: transfer.toJSON() });
  } catch (error) {
    console.error('Get stock transfer error:', error);
    res.status(500).json({ message: 'Failed to load transfer', error: error.message });
  }
});

router.post('/:hotelId/stock-transfers', getHotelContext, async (req, res) => {
  try {
    const { StockTransfer } = req.hotelModels;
    const { fromLocationId, toLocationId, items, notes } = req.body;
    if (!fromLocationId || !toLocationId) {
      return res.status(400).json({ message: 'From and to location are required' });
    }
    if (fromLocationId === toLocationId) {
      return res.status(400).json({ message: 'From and to location must be different' });
    }
    const itemsArray = Array.isArray(items) ? items : [];
    if (itemsArray.length === 0) {
      return res.status(400).json({ message: 'At least one item is required' });
    }
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const count = await StockTransfer.count({ where: { transferNumber: { [Op.like]: `TR-${dateStr}-%` } } });
    const transferNumber = `TR-${dateStr}-${String(count + 1).padStart(4, '0')}`;
    const transfer = await StockTransfer.create({
      transferNumber,
      fromLocationId,
      toLocationId,
      status: 'Pending',
      items: itemsArray,
      totalItems: itemsArray.length,
      requestedBy: req.user.id,
      requestedAt: new Date(),
      notes: notes || null,
    });
    res.status(201).json({ transfer: transfer.toJSON() });
  } catch (error) {
    console.error('Create stock transfer error:', error);
    res.status(500).json({ message: 'Failed to create transfer', error: error.message });
  }
});

router.put('/:hotelId/stock-transfers/:id', getHotelContext, async (req, res) => {
  try {
    const { StockTransfer } = req.hotelModels;
    const transfer = await StockTransfer.findByPk(req.params.id);
    if (!transfer) return res.status(404).json({ message: 'Transfer not found' });
    if (transfer.status !== 'Pending') {
      return res.status(400).json({ message: 'Only pending transfers can be updated' });
    }
    const { items, notes } = req.body;
    if (items !== undefined) {
      const itemsArray = Array.isArray(items) ? items : [];
      transfer.items = itemsArray;
      transfer.totalItems = itemsArray.length;
    }
    if (notes !== undefined) transfer.notes = notes;
    await transfer.save();
    res.json({ transfer: transfer.toJSON() });
  } catch (error) {
    console.error('Update stock transfer error:', error);
    res.status(500).json({ message: 'Failed to update transfer', error: error.message });
  }
});

router.put('/:hotelId/stock-transfers/:id/approve', getHotelContext, async (req, res) => {
  try {
    const { StockTransfer } = req.hotelModels;
    const transfer = await StockTransfer.findByPk(req.params.id);
    if (!transfer) return res.status(404).json({ message: 'Transfer not found' });
    if (transfer.status !== 'Pending') {
      return res.status(400).json({ message: 'Only pending transfers can be approved' });
    }
    transfer.status = 'Approved';
    transfer.approvedBy = req.user.id;
    transfer.approvedAt = new Date();
    await transfer.save();
    res.json({ transfer: transfer.toJSON() });
  } catch (error) {
    console.error('Approve stock transfer error:', error);
    res.status(500).json({ message: 'Failed to approve transfer', error: error.message });
  }
});

router.put('/:hotelId/stock-transfers/:id/complete', getHotelContext, async (req, res) => {
  try {
    const { StockTransfer, ItemStockByLocation, InventoryItem, StockHistory } = req.hotelModels;
    const transfer = await StockTransfer.findByPk(req.params.id);
    if (!transfer) return res.status(404).json({ message: 'Transfer not found' });
    if (transfer.status !== 'Approved' && transfer.status !== 'InTransit') {
      return res.status(400).json({ message: 'Transfer must be Approved or InTransit to complete' });
    }
    const items = Array.isArray(transfer.items) ? transfer.items : [];
    for (const line of items) {
      const itemId = line.itemId;
      const qty = Number(line.quantity) || 0;
      if (qty <= 0) continue;
      const fromRow = await ItemStockByLocation.findOne({
        where: { itemId, locationId: transfer.fromLocationId },
      });
      const toRow = await ItemStockByLocation.findOne({
        where: { itemId, locationId: transfer.toLocationId },
      });
      const fromQty = fromRow ? Number(fromRow.quantity) : 0;
      if (fromQty < qty) {
        return res.status(400).json({
          message: `Insufficient stock at source for item ${line.itemName || itemId}. Available: ${fromQty}, Requested: ${qty}`,
        });
      }
      if (fromRow) {
        fromRow.quantity = fromQty - qty;
        await fromRow.save();
      }
      if (toRow) {
        toRow.quantity = Number(toRow.quantity) + qty;
        await toRow.save();
      } else {
        await ItemStockByLocation.create({
          itemId,
          locationId: transfer.toLocationId,
          quantity: qty,
        });
      }
      const invItem = await InventoryItem.findByPk(itemId);
      if (invItem) {
        const prevTotal = Number(invItem.currentStock) || 0;
        invItem.currentStock = prevTotal;
        await invItem.save();
      }
      await StockHistory.create({
        itemId,
        movementType: 'TRANSFER',
        quantity: qty,
        previousStock: fromQty,
        newStock: fromQty - qty,
        referenceType: 'StockTransfer',
        referenceId: transfer.id,
        notes: `Transfer ${transfer.transferNumber} to another location`,
        performedBy: req.user.id,
      });
    }
    transfer.status = 'Completed';
    transfer.completedAt = new Date();
    await transfer.save();
    res.json({ transfer: transfer.toJSON(), message: 'Transfer completed and stock updated' });
  } catch (error) {
    console.error('Complete stock transfer error:', error);
    res.status(500).json({ message: 'Failed to complete transfer', error: error.message });
  }
});

router.put('/:hotelId/stock-transfers/:id/status', getHotelContext, async (req, res) => {
  try {
    const { StockTransfer } = req.hotelModels;
    const transfer = await StockTransfer.findByPk(req.params.id);
    if (!transfer) return res.status(404).json({ message: 'Transfer not found' });
    const { status } = req.body;
    const allowed = ['Pending', 'Approved', 'InTransit', 'Completed', 'Rejected'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    transfer.status = status;
    if (status === 'Approved' && !transfer.approvedBy) {
      transfer.approvedBy = req.user.id;
      transfer.approvedAt = new Date();
    }
    if (status === 'Completed') transfer.completedAt = new Date();
    await transfer.save();
    res.json({ transfer: transfer.toJSON() });
  } catch (error) {
    console.error('Update transfer status error:', error);
    res.status(500).json({ message: 'Failed to update status', error: error.message });
  }
});

// ==================== STOCK ADJUSTMENTS ====================

router.get('/:hotelId/stock-adjustments', getHotelContext, async (req, res) => {
  try {
    const { StockAdjustment } = req.hotelModels;
    try { await StockAdjustment.sync({ alter: true }); } catch (e) { console.warn('StockAdjustment sync:', e.message); }
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.adjustmentType) where.adjustmentType = req.query.adjustmentType;
    if (req.query.itemId) where.itemId = req.query.itemId;
    const adjustments = await StockAdjustment.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json({ adjustments: adjustments.map((a) => a.toJSON()) });
  } catch (error) {
    console.error('Get stock adjustments error:', error);
    res.status(500).json({ message: 'Failed to load adjustments', error: error.message });
  }
});

router.post('/:hotelId/stock-adjustments', getHotelContext, async (req, res) => {
  try {
    const { StockAdjustment, InventoryItem } = req.hotelModels;
    const { itemId, adjustmentType, quantityDelta, reason, notes } = req.body;
    if (!itemId || !adjustmentType || quantityDelta == null || quantityDelta === '' || !reason || !reason.trim()) {
      return res.status(400).json({ message: 'itemId, adjustmentType, quantityDelta, and reason are required' });
    }
    const item = await InventoryItem.findByPk(itemId);
    if (!item) return res.status(404).json({ message: 'Inventory item not found' });
    const previousStock = Number(item.currentStock || 0);
    const delta = Number(quantityDelta);
    const newStock = Math.max(0, previousStock + delta);
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const count = await StockAdjustment.count({ where: { adjustmentNumber: { [Op.like]: `ADJ-${dateStr}-%` } } });
    const adjustmentNumber = `ADJ-${dateStr}-${String(count + 1).padStart(4, '0')}`;
    const adjustment = await StockAdjustment.create({
      adjustmentNumber,
      itemId,
      adjustmentType,
      quantityDelta: delta,
      previousStock,
      newStock,
      reason: reason.trim(),
      status: 'Pending',
      requestedBy: req.user.id,
      requestedAt: new Date(),
      notes: notes ? notes.trim() : null,
    });
    res.status(201).json({ adjustment: adjustment.toJSON() });
  } catch (error) {
    console.error('Create stock adjustment error:', error);
    res.status(500).json({ message: 'Failed to create adjustment', error: error.message });
  }
});

router.put('/:hotelId/stock-adjustments/:id/approve', getHotelContext, async (req, res) => {
  try {
    const { StockAdjustment, InventoryItem, StockHistory } = req.hotelModels;
    const adjustment = await StockAdjustment.findByPk(req.params.id);
    if (!adjustment) return res.status(404).json({ message: 'Adjustment not found' });
    if (adjustment.status !== 'Pending') {
      return res.status(400).json({ message: 'Only pending adjustments can be approved' });
    }
    const item = await InventoryItem.findByPk(adjustment.itemId);
    if (!item) return res.status(404).json({ message: 'Inventory item not found' });
    item.currentStock = Number(adjustment.newStock);
    await item.save();
    await StockHistory.create({
      itemId: item.id,
      movementType: 'ADJUSTMENT',
      quantity: Math.abs(Number(adjustment.quantityDelta)),
      previousStock: Number(adjustment.previousStock),
      newStock: Number(adjustment.newStock),
      referenceType: 'StockAdjustment',
      referenceId: adjustment.id,
      notes: adjustment.reason,
      performedBy: req.user.id,
    });
    adjustment.status = 'Approved';
    adjustment.approvedBy = req.user.id;
    adjustment.approvedAt = new Date();
    await adjustment.save();
    res.json({ adjustment: adjustment.toJSON(), message: 'Adjustment approved and stock updated' });
  } catch (error) {
    console.error('Approve stock adjustment error:', error);
    res.status(500).json({ message: 'Failed to approve adjustment', error: error.message });
  }
});

router.put('/:hotelId/stock-adjustments/:id/reject', getHotelContext, async (req, res) => {
  try {
    const { StockAdjustment } = req.hotelModels;
    const adjustment = await StockAdjustment.findByPk(req.params.id);
    if (!adjustment) return res.status(404).json({ message: 'Adjustment not found' });
    if (adjustment.status !== 'Pending') {
      return res.status(400).json({ message: 'Only pending adjustments can be rejected' });
    }
    adjustment.status = 'Rejected';
    adjustment.approvedBy = req.user.id;
    adjustment.approvedAt = new Date();
    await adjustment.save();
    res.json({ adjustment: adjustment.toJSON() });
  } catch (error) {
    console.error('Reject stock adjustment error:', error);
    res.status(500).json({ message: 'Failed to reject adjustment', error: error.message });
  }
});

// ==================== INVENTORY REPORTS ====================

router.get('/:hotelId/reports/inventory/stock-summary', getHotelContext, async (req, res) => {
  try {
    const { InventoryItem } = req.hotelModels;
    const items = await InventoryItem.findAll({ where: { isActive: true } });
    const totalItems = items.length;
    const totalQuantity = items.reduce((sum, i) => sum + Number(i.currentStock || 0), 0);
    const totalValue = items.reduce((sum, i) => sum + Number(i.currentStock || 0) * Number(i.unitPrice || i.costPrice || 0), 0);
    const lowStock = items.filter((i) => Number(i.currentStock || 0) < Number(i.reorderLevel || 0)).length;
    const byCategory = {};
    items.forEach((i) => {
      const cat = i.category || 'Uncategorized';
      if (!byCategory[cat]) byCategory[cat] = { count: 0, quantity: 0, value: 0 };
      byCategory[cat].count++;
      byCategory[cat].quantity += Number(i.currentStock || 0);
      byCategory[cat].value += Number(i.currentStock || 0) * Number(i.unitPrice || i.costPrice || 0);
    });
    res.json({ totalItems, totalQuantity, totalValue, lowStock, byCategory });
  } catch (error) {
    console.error('Stock summary report error:', error);
    res.status(500).json({ message: 'Failed to generate report', error: error.message });
  }
});

router.get('/:hotelId/reports/inventory/purchase-report', getHotelContext, async (req, res) => {
  try {
    const { PurchaseOrder } = req.hotelModels;
    const where = {};
    if (req.query.startDate) where.orderDate = { [Op.gte]: new Date(req.query.startDate) };
    if (req.query.endDate) where.orderDate = { ...where.orderDate, [Op.lte]: new Date(req.query.endDate) };
    const orders = await PurchaseOrder.findAll({ where, order: [['orderDate', 'DESC']] });
    const totalOrders = orders.length;
    const totalAmount = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const byStatus = {};
    orders.forEach((o) => {
      const s = o.status || 'Unknown';
      byStatus[s] = (byStatus[s] || 0) + 1;
    });
    const byMonth = {};
    orders.forEach((o) => {
      const d = new Date(o.orderDate || o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      byMonth[key] = (byMonth[key] || 0) + Number(o.totalAmount || 0);
    });
    res.json({ totalOrders, totalAmount, byStatus, byMonth, orders: orders.slice(0, 50) });
  } catch (error) {
    console.error('Purchase report error:', error);
    res.status(500).json({ message: 'Failed to generate report', error: error.message });
  }
});

router.get('/:hotelId/reports/inventory/supplier-report', getHotelContext, async (req, res) => {
  try {
    const { Supplier, PurchaseOrder } = req.hotelModels;
    const suppliers = await Supplier.findAll({ where: { isActive: true } });
    const orders = await PurchaseOrder.findAll({ order: [['createdAt', 'DESC']] });
    const report = suppliers.map((s) => {
      const supplierOrders = orders.filter((o) => o.supplierId === s.id);
      const totalOrders = supplierOrders.length;
      const totalAmount = supplierOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
      const outstanding = Number(s.outstandingBalance || 0);
      return { supplier: s.toJSON(), totalOrders, totalAmount, outstanding };
    });
    res.json({ report });
  } catch (error) {
    console.error('Supplier report error:', error);
    res.status(500).json({ message: 'Failed to generate report', error: error.message });
  }
});

router.get('/:hotelId/reports/inventory/stock-movement', getHotelContext, async (req, res) => {
  try {
    const { StockHistory } = req.hotelModels;
    const where = {};
    if (req.query.startDate) where.createdAt = { [Op.gte]: new Date(req.query.startDate) };
    if (req.query.endDate) where.createdAt = { ...where.createdAt, [Op.lte]: new Date(req.query.endDate) };
    if (req.query.itemId) where.itemId = req.query.itemId;
    const history = await StockHistory.findAll({ where, order: [['createdAt', 'DESC']], limit: 200 });
    const inward = history.filter((h) => h.movementType === 'IN').reduce((sum, h) => sum + Number(h.quantity || 0), 0);
    const outward = history.filter((h) => h.movementType === 'OUT').reduce((sum, h) => sum + Number(h.quantity || 0), 0);
    const adjustments = history.filter((h) => h.movementType === 'ADJUSTMENT').length;
    res.json({ inward, outward, adjustments, history: history.slice(0, 100) });
  } catch (error) {
    console.error('Stock movement report error:', error);
    res.status(500).json({ message: 'Failed to generate report', error: error.message });
  }
});

router.get('/:hotelId/reports/inventory/expiry-report', getHotelContext, async (req, res) => {
  try {
    const { InventoryItem } = req.hotelModels;
    const items = await InventoryItem.findAll({ where: { isActive: true } });
    const now = new Date();
    const next30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expired = items.filter((i) => i.expiryDate && new Date(i.expiryDate) < now);
    const nearExpiry = items.filter((i) => i.expiryDate && new Date(i.expiryDate) >= now && new Date(i.expiryDate) <= next30);
    res.json({ expired, nearExpiry, total: items.length });
  } catch (error) {
    console.error('Expiry report error:', error);
    res.status(500).json({ message: 'Failed to generate report', error: error.message });
  }
});

router.get('/:hotelId/reports/inventory/valuation', getHotelContext, async (req, res) => {
  try {
    const { InventoryItem } = req.hotelModels;
    const items = await InventoryItem.findAll({ where: { isActive: true } });
    const totalValue = items.reduce((sum, i) => sum + Number(i.currentStock || 0) * Number(i.unitPrice || i.costPrice || 0), 0);
    const byCategory = {};
    items.forEach((i) => {
      const cat = i.category || 'Uncategorized';
      if (!byCategory[cat]) byCategory[cat] = 0;
      byCategory[cat] += Number(i.currentStock || 0) * Number(i.unitPrice || i.costPrice || 0);
    });
    res.json({ totalValue, byCategory, itemCount: items.length });
  } catch (error) {
    console.error('Valuation report error:', error);
    res.status(500).json({ message: 'Failed to generate report', error: error.message });
  }
});

// ==================== STOCK ALERTS & NOTIFICATIONS ====================

router.get('/:hotelId/stock-alerts/low-stock', getHotelContext, async (req, res) => {
  try {
    const { InventoryItem } = req.hotelModels;
    const items = await InventoryItem.findAll({ where: { isActive: true }, order: [['name', 'ASC']] });
    const lowStock = items.filter((i) => Number(i.currentStock || 0) < Number(i.reorderLevel || 0));
    const critical = lowStock.filter((i) => Number(i.currentStock || 0) <= Number(i.reorderLevel || 0) * 0.5);
    const warning = lowStock.filter((i) => Number(i.currentStock || 0) > Number(i.reorderLevel || 0) * 0.5);
    res.json({ lowStock, critical, warning, total: items.length });
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({ message: 'Failed to load low stock items', error: error.message });
  }
});

router.post('/:hotelId/stock-alerts/notify', getHotelContext, async (req, res) => {
  try {
    const { StockAlertNotification, InventoryItem } = req.hotelModels;
    const { itemId, channel, recipient } = req.body;
    if (!itemId || !channel) return res.status(400).json({ message: 'itemId and channel are required' });
    const item = await InventoryItem.findByPk(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    const currentStock = Number(item.currentStock || 0);
    const reorderLevel = Number(item.reorderLevel || 0);
    let alertType = 'LOW_STOCK';
    if (currentStock === 0) alertType = 'OUT_OF_STOCK';
    else if (currentStock <= reorderLevel * 0.5) alertType = 'CRITICAL_STOCK';
    const message = `Alert: ${item.name} stock is ${alertType.replace('_', ' ').toLowerCase()} (Current: ${currentStock}, Reorder: ${reorderLevel})`;
    const notification = await StockAlertNotification.create({
      itemId,
      alertType,
      channel,
      recipient: recipient || null,
      message,
      status: 'Sent',
      currentStock,
      reorderLevel,
      sentAt: new Date(),
    });
    res.status(201).json({ notification: notification.toJSON() });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ message: 'Failed to send notification', error: error.message });
  }
});

router.get('/:hotelId/stock-alerts/notifications', getHotelContext, async (req, res) => {
  try {
    const { StockAlertNotification } = req.hotelModels;
    try { await StockAlertNotification.sync({ alter: true }); } catch (e) { console.warn('StockAlertNotification sync:', e.message); }
    const where = {};
    if (req.query.itemId) where.itemId = req.query.itemId;
    if (req.query.status) where.status = req.query.status;
    const notifications = await StockAlertNotification.findAll({ where, order: [['createdAt', 'DESC']], limit: 100 });
    res.json({ notifications: notifications.map((n) => n.toJSON()) });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Failed to load notifications', error: error.message });
  }
});

router.post('/:hotelId/stock-alerts/auto-generate-po', getHotelContext, async (req, res) => {
  try {
    const { InventoryItem, PurchaseOrder } = req.hotelModels;
    const { itemIds, supplierId } = req.body;
    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ message: 'itemIds array is required' });
    }
    if (!supplierId) return res.status(400).json({ message: 'supplierId is required' });
    const items = await InventoryItem.findAll({ where: { id: itemIds, isActive: true } });
    if (items.length === 0) return res.status(404).json({ message: 'No valid items found' });
    const orderItems = items.map((i) => {
      const deficit = Number(i.reorderLevel || 0) - Number(i.currentStock || 0);
      const qty = Math.max(deficit, Number(i.reorderLevel || 0));
      return {
        itemId: i.id,
        itemName: i.name,
        quantity: qty,
        unitPrice: Number(i.costPrice || i.unitPrice || 0),
        totalPrice: qty * Number(i.costPrice || i.unitPrice || 0),
      };
    });
    const subtotal = orderItems.reduce((sum, it) => sum + Number(it.totalPrice || 0), 0);
    const taxRate = 0;
    const taxAmount = 0;
    const totalAmount = subtotal;
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await PurchaseOrder.count({ where: { orderNumber: { [Op.like]: `PO-${year}${month}-%` } } });
    const orderNumber = `PO-${year}${month}-${String(count + 1).padStart(4, '0')}`;
    const order = await PurchaseOrder.create({
      orderNumber,
      supplierId,
      status: 'Draft',
      items: orderItems,
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      notes: 'Auto-generated from low stock alert',
    });
    res.status(201).json({ order: order.toJSON(), message: 'Purchase order created' });
  } catch (error) {
    console.error('Auto generate PO error:', error);
    res.status(500).json({ message: 'Failed to generate PO', error: error.message });
  }
});

/**
 * @route   GET /api/hotel-data/:hotelId/inventory-categories
 * @desc    List inventory categories (optional: includeInactive=true)
 * @access  Private
 */
router.get('/:hotelId/inventory-categories', getHotelContext, async (req, res) => {
  try {
    const { InventoryCategory } = req.hotelModels;
    const where = {};
    if (req.query.includeInactive !== 'true') {
      where.isActive = true;
    }
    const categories = await InventoryCategory.findAll({
      where,
      order: [
        ['sortOrder', 'ASC'],
        ['createdAt', 'DESC'],
      ],
    });
    res.json({ categories });
  } catch (error) {
    console.error('Get inventory categories error:', error);
    res.status(500).json({
      message: 'Failed to load inventory categories',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/hotel-data/:hotelId/inventory-categories
 * @desc    Create inventory category
 * @access  Private
 */
router.post(
  '/:hotelId/inventory-categories',
  getHotelContext,
  [body('name').trim().notEmpty().withMessage('Name is required')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }
      const { InventoryCategory } = req.hotelModels;
      const payload = {
        name: String(req.body.name || '').trim(),
        description: req.body.description != null ? String(req.body.description).trim() : null,
        imageUrl: req.body.imageUrl != null ? String(req.body.imageUrl) : null,
        parentId: req.body.parentId || null,
        sortOrder: req.body.sortOrder != null ? Number(req.body.sortOrder) : 0,
        isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : true,
        notes: req.body.notes != null ? String(req.body.notes).trim() : null,
      };
      const category = await InventoryCategory.create(payload);
      res.status(201).json({ category: category.toJSON() });
    } catch (error) {
      console.error('Create inventory category error:', error);
      res.status(500).json({
        message: 'Failed to create inventory category',
        error: error.message,
      });
    }
  },
);

/**
 * @route   PUT /api/hotel-data/:hotelId/inventory-categories/:id
 * @desc    Update inventory category
 * @access  Private
 */
router.put('/:hotelId/inventory-categories/:id', getHotelContext, async (req, res) => {
  try {
    const { InventoryCategory } = req.hotelModels;
    const category = await InventoryCategory.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Inventory category not found' });
    }

    const fields = ['name', 'description', 'imageUrl', 'parentId', 'sortOrder', 'isActive', 'notes'];
    fields.forEach((field) => {
      if (req.body[field] === undefined) return;
      if (field === 'sortOrder') {
        category.sortOrder = Number(req.body.sortOrder) || 0;
      } else if (field === 'isActive') {
        category.isActive = Boolean(req.body.isActive);
      } else if (field === 'name') {
        category.name = String(req.body.name || '').trim();
      } else if (field === 'parentId') {
        category.parentId = req.body.parentId || null;
      } else if (field === 'imageUrl') {
        category.imageUrl = req.body.imageUrl != null ? String(req.body.imageUrl) : null;
      } else {
        category[field] = req.body[field] != null ? String(req.body[field]).trim() : null;
      }
    });

    await category.save();
    res.json({ category: category.toJSON() });
  } catch (error) {
    console.error('Update inventory category error:', error);
    res.status(500).json({
      message: 'Failed to update inventory category',
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/hotel-data/:hotelId/inventory-categories/:id
 * @desc    Delete inventory category
 * @access  Private
 */
router.delete('/:hotelId/inventory-categories/:id', getHotelContext, async (req, res) => {
  try {
    const { InventoryCategory, InventoryItem } = req.hotelModels;
    const category = await InventoryCategory.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Inventory category not found' });
    }

    // Basic safety: block delete when items still reference the category name
    const itemsCount = await InventoryItem.count({
      where: { category: category.name },
    });
    if (itemsCount > 0) {
      return res.status(409).json({
        message: `Cannot delete category. ${itemsCount} inventory item(s) still reference this category.`,
      });
    }

    await category.destroy();
    res.json({ message: 'Inventory category deleted' });
  } catch (error) {
    console.error('Delete inventory category error:', error);
    res.status(500).json({
      message: 'Failed to delete inventory category',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/hotel-data/:hotelId/inventory-categories/reorder
 * @desc    Bulk update category sort order (payload: { order: [id1,id2,...] })
 * @access  Private
 */
router.put('/:hotelId/inventory-categories/reorder', getHotelContext, async (req, res) => {
  try {
    const { InventoryCategory } = req.hotelModels;
    const order = Array.isArray(req.body.order) ? req.body.order.map((id) => String(id)) : [];
    if (order.length === 0) {
      return res.status(400).json({ message: 'order array is required' });
    }

    const categories = await InventoryCategory.findAll({ where: { id: order } });
    const byId = new Map(categories.map((c) => [String(c.id), c]));
    for (let i = 0; i < order.length; i += 1) {
      const c = byId.get(order[i]);
      if (!c) continue;
      c.sortOrder = i;
      await c.save();
    }

    res.json({ message: 'Category order updated' });
  } catch (error) {
    console.error('Reorder inventory categories error:', error);
    res.status(500).json({
      message: 'Failed to reorder inventory categories',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/hotel-data/:hotelId/inventory-categories/bulk-import
 * @desc    Bulk import categories (payload: { categories: [{name,description,parentId,parentName,sortOrder,isActive,imageUrl}] })
 * @access  Private
 */
router.post('/:hotelId/inventory-categories/bulk-import', getHotelContext, async (req, res) => {
  try {
    const { InventoryCategory } = req.hotelModels;
    const incoming = Array.isArray(req.body.categories) ? req.body.categories : [];
    if (incoming.length === 0) {
      return res.status(400).json({ message: 'categories array is required' });
    }

    // Resolve parents by name (if provided)
    const parentNames = incoming.map((c) => (c.parentName ? String(c.parentName).trim() : '')).filter(Boolean);
    let existingParents = [];
    if (parentNames.length) {
      existingParents = await InventoryCategory.findAll({ where: { name: parentNames } });
    }
    const parentByName = new Map(existingParents.map((p) => [String(p.name), p]));

    const created = [];
    for (const raw of incoming) {
      const name = String(raw?.name || '').trim();
      if (!name) continue;
      const parentId =
        raw?.parentId ||
        (raw?.parentName && parentByName.get(String(raw.parentName).trim())
          ? parentByName.get(String(raw.parentName).trim()).id
          : null);

      const payload = {
        name,
        description: raw?.description != null ? String(raw.description).trim() : null,
        imageUrl: raw?.imageUrl != null ? String(raw.imageUrl) : null,
        parentId: parentId || null,
        sortOrder: raw?.sortOrder != null ? Number(raw.sortOrder) : 0,
        isActive: raw?.isActive !== undefined ? Boolean(raw.isActive) : true,
      };
      const cat = await InventoryCategory.create(payload);
      created.push(cat.toJSON());
    }

    res.status(201).json({ createdCount: created.length, categories: created });
  } catch (error) {
    console.error('Bulk import inventory categories error:', error);
    res.status(500).json({
      message: 'Failed to bulk import inventory categories',
      error: error.message,
    });
  }
});

module.exports = router;
