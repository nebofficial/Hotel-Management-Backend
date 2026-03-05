const { sequelize } = require('../config/database');
const MultiTenantDB = require('./multiTenantDB');
const createRestaurantBillModel = require('../models/hotel/RestaurantBill');

/**
 * Sync RestaurantBill table for all existing hotel schemas
 * This ensures the restaurant_bills table exists for hotels created before this feature was added
 */
const syncRestaurantBillTables = async () => {
  try {
    const hotelNames = await MultiTenantDB.listHotelDatabases();
    
    if (!hotelNames || hotelNames.length === 0) {
      console.log('No hotel schemas found. RestaurantBill tables will be created when hotels are added.');
      return;
    }

    console.log(`Syncing RestaurantBill tables for ${hotelNames.length} hotel schema(s)...`);

    for (const hotelName of hotelNames) {
      try {
        const schemaName = MultiTenantDB.getSchemaName(hotelName);
        const RestaurantBill = createRestaurantBillModel(sequelize, schemaName);
        
        // Sync table (creates if doesn't exist, alters to add new columns)
        await RestaurantBill.sync({ alter: true });
        console.log(`✓ RestaurantBill table synced for schema: ${schemaName}`);
      } catch (error) {
        console.error(`✗ Failed to sync RestaurantBill table for hotel ${hotelName}:`, error.message);
      }
    }

    console.log('RestaurantBill table sync completed.');
  } catch (error) {
    console.error('Error syncing RestaurantBill tables:', error);
    throw error;
  }
};

module.exports = syncRestaurantBillTables;
