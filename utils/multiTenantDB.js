const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

/**
 * Multi-tenant database service for PostgreSQL
 * Creates separate schemas for each hotel using hotel name as identifier
 */
class MultiTenantDB {
  /**
   * Sanitize hotel name to be a valid PostgreSQL schema name
   * @param {string} hotelName - The hotel name
   * @returns {string} - Sanitized schema name
   */
  static sanitizeSchemaName(hotelName) {
    return hotelName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Get schema name for a hotel
   * @param {string} hotelName - The hotel name
   * @returns {string} - Schema name
   */
  static getSchemaName(hotelName) {
    return `hotel_${this.sanitizeSchemaName(hotelName)}`;
  }

  /**
   * Create hotel schema and tables
   * @param {string} hotelName - Hotel name
   */
  static async createHotelDatabase(hotelName) {
    try {
      const schemaName = this.getSchemaName(hotelName);
      
      // Create schema if it doesn't exist
      await sequelize.query(
        `CREATE SCHEMA IF NOT EXISTS "${schemaName}"`,
        { type: QueryTypes.RAW }
      );

      // Import models to create tables
      const createBookingModel = require('../models/hotel/Booking');
      const createGuestModel = require('../models/hotel/Guest');
      const createPaymentModel = require('../models/hotel/Payment');
      const createRoomModel = require('../models/hotel/Room');
      const createHousekeepingTaskModel = require('../models/hotel/HousekeepingTask');
      const createMaintenanceRequestModel = require('../models/hotel/MaintenanceRequest');
      const createFeedbackModel = require('../models/hotel/Feedback');
      const createComplaintModel = require('../models/hotel/Complaint');
      const createInspectionModel = require('../models/hotel/Inspection');
      const createLaundryTaskModel = require('../models/hotel/LaundryTask');
      const createLinenItemModel = require('../models/hotel/LinenItem');
      const createLinenUsageModel = require('../models/hotel/LinenUsage');
      const createStaffMemberModel = require('../models/hotel/StaffMember');
      const createStaffScheduleModel = require('../models/hotel/StaffSchedule');
      const createRestaurantBillModel = require('../models/hotel/RestaurantBill');
      const createMenuCategoryModel = require('../models/hotel/MenuCategory');
      const createMenuItemModel = require('../models/hotel/MenuItem');
      const createRestaurantTableModel = require('../models/hotel/RestaurantTable');
      const createTableReservationModel = require('../models/hotel/TableReservation');
      const createComboOfferModel = require('../models/hotel/ComboOffer');
      const createDiscountOfferModel = require('../models/hotel/DiscountOffer');
      const createCouponCodeModel = require('../models/hotel/CouponCode');
      const createKitchenKOTModel = require('../models/hotel/KitchenKOT');
      const createBarOrderModel = require('../models/hotel/BarOrder');
      const createBarInventoryItemModel = require('../models/hotel/BarInventoryItem');
      const createRoomServiceOrderModel = require('../models/hotel/RoomServiceOrder');

      // Create models with schema
      const Booking = createBookingModel(sequelize, schemaName);
      const Guest = createGuestModel(sequelize, schemaName);
      const Payment = createPaymentModel(sequelize, schemaName);
      const Room = createRoomModel(sequelize, schemaName);
      const HousekeepingTask = createHousekeepingTaskModel(sequelize, schemaName);
      const MaintenanceRequest = createMaintenanceRequestModel(sequelize, schemaName);
      const Feedback = createFeedbackModel(sequelize, schemaName);
      const Complaint = createComplaintModel(sequelize, schemaName);
      const Inspection = createInspectionModel(sequelize, schemaName);
      const LaundryTask = createLaundryTaskModel(sequelize, schemaName);
      const LinenItem = createLinenItemModel(sequelize, schemaName);
      const LinenUsage = createLinenUsageModel(sequelize, schemaName);
      const StaffMember = createStaffMemberModel(sequelize, schemaName);
      const StaffSchedule = createStaffScheduleModel(sequelize, schemaName);
      const RestaurantBill = createRestaurantBillModel(sequelize, schemaName);
      const MenuCategory = createMenuCategoryModel(sequelize, schemaName);
      const MenuItem = createMenuItemModel(sequelize, schemaName);
      const RestaurantTable = createRestaurantTableModel(sequelize, schemaName);
      const TableReservation = createTableReservationModel(sequelize, schemaName);
      const ComboOffer = createComboOfferModel(sequelize, schemaName);
      const DiscountOffer = createDiscountOfferModel(sequelize, schemaName);
      const CouponCode = createCouponCodeModel(sequelize, schemaName);
      const KitchenKOT = createKitchenKOTModel(sequelize, schemaName);
      const BarOrder = createBarOrderModel(sequelize, schemaName);
      const BarInventoryItem = createBarInventoryItemModel(sequelize, schemaName);
      const RoomServiceOrder = createRoomServiceOrderModel(sequelize, schemaName);

      // Sync tables
      await Booking.sync({ alter: false });
      await Guest.sync({ alter: false });
      await Payment.sync({ alter: false });
      await Room.sync({ alter: false });
      await HousekeepingTask.sync({ alter: false });
      await MaintenanceRequest.sync({ alter: false });
      await Feedback.sync({ alter: false });
      await Complaint.sync({ alter: false });
      await Inspection.sync({ alter: false });
      await LaundryTask.sync({ alter: false });
      await LinenItem.sync({ alter: false });
      await LinenUsage.sync({ alter: false });
      await StaffMember.sync({ alter: false });
      await StaffSchedule.sync({ alter: false });
      await RestaurantBill.sync({ alter: false });
      await MenuCategory.sync({ alter: false });
      await MenuItem.sync({ alter: false });
      await RestaurantTable.sync({ alter: false });
      await TableReservation.sync({ alter: false });
      await ComboOffer.sync({ alter: false });
      await DiscountOffer.sync({ alter: false });
      await CouponCode.sync({ alter: false });
      await KitchenKOT.sync({ alter: false });
      await BarOrder.sync({ alter: false });
      await BarInventoryItem.sync({ alter: false });
      await RoomServiceOrder.sync({ alter: false });

      console.log(`Hotel schema created/verified: ${schemaName}`);
      return true;
    } catch (error) {
      console.error(`Error creating hotel schema for ${hotelName}:`, error);
      throw error;
    }
  }

  /**
   * Delete hotel schema
   * @param {string} hotelName - Hotel name
   */
  static async deleteHotelDatabase(hotelName) {
    try {
      const schemaName = this.getSchemaName(hotelName);
      
      // Drop schema and all its objects (CASCADE)
      await sequelize.query(
        `DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`,
        { type: QueryTypes.RAW }
      );

      console.log(`Hotel schema deleted: ${schemaName}`);
      return true;
    } catch (error) {
      console.error(`Error deleting hotel schema for ${hotelName}:`, error);
      throw error;
    }
  }

  /**
   * List all hotel schemas
   * @returns {Array} - Array of hotel schema names
   */
  static async listHotelDatabases() {
    try {
      const results = await sequelize.query(
        `SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'hotel_%'`,
        { type: QueryTypes.SELECT }
      );
      
      if (!Array.isArray(results)) return [];
      return results.map(row => String(row.schema_name || '').replace(/^hotel_/, '')).filter(Boolean);
    } catch (error) {
      console.error('Error listing hotel schemas:', error);
      return [];
    }
  }
}

module.exports = MultiTenantDB;
