const express = require('express');
const multiPropertyController = require('../controllers/multiPropertyController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/stats', multiPropertyController.getPropertyStats);
router.get('/occupancy', multiPropertyController.getOccupancyAcrossProperties);
router.get('/revenue', multiPropertyController.getTotalRevenue);
router.get('/comparison', multiPropertyController.getPropertyComparison);
router.get('/revenue-distribution', multiPropertyController.getRevenueDistribution);
router.get('/recent-activity', multiPropertyController.getRecentPropertyActivity);
router.get('/properties', multiPropertyController.getPropertiesList);
router.get('/total-bookings', multiPropertyController.getTotalBookings);
router.get('/monthly-trends', multiPropertyController.getMonthlyTrends);

module.exports = router;
