const express = require('express');
const {
  getRestaurantSalesSummary,
  getDailyRestaurantSales,
  getItemWiseSales,
  getCategoryWiseSales,
  getTopSellingItems,
  getPaymentMethodAnalysis,
  getRestaurantSalesTrend,
  exportRestaurantSalesReport,
} = require('../controllers/restaurantSalesController');

module.exports = function createRestaurantSalesRoutes(getHotelContext) {
  const router = express.Router({ mergeParams: true });

  router.get('/summary', getHotelContext, getRestaurantSalesSummary);
  router.get('/daily', getHotelContext, getDailyRestaurantSales);
  router.get('/item-wise', getHotelContext, getItemWiseSales);
  router.get('/category-wise', getHotelContext, getCategoryWiseSales);
  router.get('/top-selling', getHotelContext, getTopSellingItems);
  router.get('/payment-analysis', getHotelContext, getPaymentMethodAnalysis);
  router.get('/trend', getHotelContext, getRestaurantSalesTrend);
  router.get('/export', getHotelContext, exportRestaurantSalesReport);

  return router;
};
