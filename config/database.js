const { Sequelize } = require('sequelize');

// Get PostgreSQL connection details from environment
const DB_NAME = process.env.DB_NAME || 'hotel_db';
const DB_USER = process.env.DB_USER || 'mero_hotel';
const DB_PASSWORD = process.env.DB_PASSWORD || '2057@JKhotel';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;

// Create Sequelize instance
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`PostgreSQL Connected: ${DB_HOST}:${DB_PORT}`);
    console.log(`Database: ${DB_NAME}`);
    
    // Ensure models are loaded before syncing
    // Models are loaded in server.js, but we need to make sure they're ready
    const { User, Hotel, Role, Plan } = require('../models');
    
    // Sync models (in production, use migrations instead)
    if (process.env.NODE_ENV !== 'production') {
      // Sync in correct order to handle foreign keys
      await sequelize.sync({ alter: false, force: false });
      console.log('Database tables synced successfully');
    }

    // Ensure hotel_profiles has optional columns (description, hours, social links)
    const { ensureHotelProfileColumns } = require('../utils/ensureHotelProfileColumns');
    await ensureHotelProfileColumns();

    // One-time: allow roomType as any string (Single, Double, etc.) in hotel schemas
    const { migrateRoomTypeToVarchar } = require('../utils/migrateRoomTypeToVarchar');
    await migrateRoomTypeToVarchar();

    // Ensure new Rooms & Property tables exist for all existing hotel schemas
    const { syncRoomsPropertyTables } = require('../utils/syncRoomsPropertyTables');
    await syncRoomsPropertyTables();

    // Ensure loyalty columns exist on guests table in all hotel schemas
    const { ensureLoyaltyColumns } = require('../utils/ensureLoyaltyColumns');
    await ensureLoyaltyColumns();

    // Ensure reservation columns exist on bookings table in all hotel schemas
    const { ensureReservationColumns } = require('../utils/ensureReservationColumns');
    await ensureReservationColumns();

    // Ensure group_bookings table exists for all existing hotel schemas
    const { syncGroupBookingTables } = require('../utils/syncGroupBookingTables');
    await syncGroupBookingTables();

    // Ensure walkin_bookings table exists for all existing hotel schemas
    const { syncWalkinTables } = require('../utils/syncWalkinTables');
    await syncWalkinTables();

    // Ensure Feedback & Complaint tables exist for all existing hotel schemas
    const { ensureFeedbackTables } = require('../utils/ensureFeedbackTables');
    await ensureFeedbackTables();

    // Ensure Inspection tables exist for all existing hotel schemas
    const { syncInspectionTables } = require('../utils/syncInspectionTables');
    await syncInspectionTables();

    // Ensure LaundryTask tables exist for all existing hotel schemas
    const syncLaundryTables = require('../utils/syncLaundryTables');
    await syncLaundryTables();

    // Ensure LinenItem and LinenUsage tables exist for all existing hotel schemas
    const syncLinenTables = require('../utils/syncLinenTables');
    await syncLinenTables();

    // Ensure StaffMember and StaffSchedule tables exist for all existing hotel schemas
    const syncStaffTables = require('../utils/syncStaffTables');
    await syncStaffTables();

    // Ensure RestaurantBill tables exist for all existing hotel schemas
    const syncRestaurantBillTables = require('../utils/syncRestaurantBillTables');
    await syncRestaurantBillTables();

    // Ensure MenuCategory and MenuItem tables exist for all existing hotel schemas
    const syncMenuTables = require('../utils/syncMenuTables');
    await syncMenuTables();

    // Ensure RestaurantTable and TableReservation tables exist for all existing hotel schemas
    const syncTableTables = require('../utils/syncTableTables');
    await syncTableTables();

    // Ensure ComboOffer, DiscountOffer, and CouponCode tables exist for all existing hotel schemas
    const syncComboOfferTables = require('../utils/syncComboOfferTables');
    await syncComboOfferTables();

    // Ensure KitchenKOT tables exist for all existing hotel schemas
    const syncKitchenKOTTables = require('../utils/syncKitchenKOTTables');
    await syncKitchenKOTTables();

    // Ensure BarOrder and BarInventoryItem tables exist for all existing hotel schemas
    const syncBarOrderTables = require('../utils/syncBarOrderTables');
    await syncBarOrderTables();

    // Ensure RoomServiceOrder tables exist for all existing hotel schemas
    const syncRoomServiceTables = require('../utils/syncRoomServiceTables');
    await syncRoomServiceTables();

    // Ensure Takeaway/Delivery tables exist for all existing hotel schemas
    const syncTakeawayDeliveryTables = require('../utils/syncTakeawayDeliveryTables');
    await syncTakeawayDeliveryTables();

    // Ensure HappyHourPricingRule tables exist for all existing hotel schemas
    const syncHappyHourPricingTables = require('../utils/syncHappyHourPricingTables');
    await syncHappyHourPricingTables();

    // Ensure Inventory tables exist for all existing hotel schemas
    const syncInventoryTables = require('../utils/syncInventoryTables');
    await syncInventoryTables();

    // Ensure Expense (finance) table exists for all existing hotel schemas
    const syncFinanceTables = require('../utils/syncFinanceTables');
    await syncFinanceTables();
  } catch (error) {
    console.error(`PostgreSQL Connection Error: ${error.message}`);
    console.error('Please make sure:');
    console.error('1. PostgreSQL is running');
    console.error('2. Database credentials are set in .env file');
    console.error('3. Database exists (create it manually if needed)');
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };

