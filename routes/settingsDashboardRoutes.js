const express = require('express');
const { authenticate, requireSuperAdmin } = require('../middleware/auth');
const settingsDashboardController = require('../controllers/settingsDashboardController');

const router = express.Router();

router.use(authenticate);
router.use(requireSuperAdmin);

router.get('/overview', settingsDashboardController.getOverview);
router.get('/health', settingsDashboardController.getSystemHealth);
router.get('/recent-config', settingsDashboardController.getRecentConfigActivity);

module.exports = router;

