const express = require('express');
const {
  fetchCampaigns,
  createEmailCampaign,
  createSmsCampaign,
  scheduleCampaign,
  sendBulkCampaign,
  fetchCampaignAnalytics,
  updateCampaignStatus,
} = require('../controllers/campaignController');

module.exports = function createCampaignRoutes(getHotelContext) {
  const router = express.Router({ mergeParams: true });

  router.get('/', getHotelContext, fetchCampaigns);
  router.post('/email', getHotelContext, createEmailCampaign);
  router.post('/sms', getHotelContext, createSmsCampaign);
  router.post('/:id/schedule', getHotelContext, scheduleCampaign);
  router.post('/:id/send', getHotelContext, sendBulkCampaign);
  router.post('/:id/status', getHotelContext, updateCampaignStatus);
  router.get('/analytics', getHotelContext, fetchCampaignAnalytics);

  return router;
};

