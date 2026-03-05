const { sequelize } = require('../config/database');
const MultiTenantDB = require('./multiTenantDB');
const createPaymentModel = require('../models/hotel/Payment');
const createBookingModel = require('../models/hotel/Booking');
const createGroupBookingModel = require('../models/hotel/GroupBooking');
const createWalkinBookingModel = require('../models/hotel/WalkinBooking');
const createMaintenanceBlockModel = require('../models/hotel/MaintenanceBlock');
const createStayModel = require('../models/hotel/Stay');
const createStayChargeModel = require('../models/hotel/StayCharge');
const createStayApprovalModel = require('../models/hotel/StayApproval');
const createGuestModel = require('../models/hotel/Guest');
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
const createTakeawayCustomerModel = require('../models/hotel/TakeawayCustomer');
const createDeliveryPartnerModel = require('../models/hotel/DeliveryPartner');
const createDeliveryAreaModel = require('../models/hotel/DeliveryArea');
const createDeliveryChargesConfigModel = require('../models/hotel/DeliveryChargesConfig');
const createTakeawayDeliveryOrderModel = require('../models/hotel/TakeawayDeliveryOrder');
const createTakeawayNotificationLogModel = require('../models/hotel/TakeawayNotificationLog');
const createHappyHourPricingRuleModel = require('../models/hotel/HappyHourPricingRule');
const createInventoryItemModel = require('../models/hotel/InventoryItem');
const createInventoryCategoryModel = require('../models/hotel/InventoryCategory');
const createStockHistoryModel = require('../models/hotel/StockHistory');
const createSupplierModel = require('../models/hotel/Supplier');
const createPurchaseOrderModel = require('../models/hotel/PurchaseOrder');
const createGRNModel = require('../models/hotel/GRN');
const createInventoryLocationModel = require('../models/hotel/InventoryLocation');
const createItemStockByLocationModel = require('../models/hotel/ItemStockByLocation');
const createStockTransferModel = require('../models/hotel/StockTransfer');
const createStockAdjustmentModel = require('../models/hotel/StockAdjustment');
const createStockAlertNotificationModel = require('../models/hotel/StockAlertNotification');
const createExpenseModel = require('../models/hotel/Expense');
const createAccountHeadModel = require('../models/hotel/AccountHead');
const createGuestLedgerEntryModel = require('../models/hotel/GuestLedgerEntry');
const createAdvancePaymentModel = require('../models/hotel/AdvancePayment');
const createCashBankAccountModel = require('../models/hotel/CashBankAccount');
const createCashBankEntryModel = require('../models/hotel/CashBankEntry');
const createDayClosingModel = require('../models/hotel/DayClosing');
const createInvoiceModel = require('../models/hotel/Invoice');
const createCorporateAccountModel = require('../models/hotel/CorporateAccount');
const createCorporateInvoiceModel = require('../models/hotel/CorporateInvoice');
const createTaxSettingModel = require('../models/hotel/TaxSetting');
const createJournalEntryModel = require('../models/hotel/JournalEntry');
const createRoomBillModel = require('../models/hotel/RoomBill');
const createRefundModel = require('../models/hotel/Refund');
const createCreditNoteModel = require('../models/hotel/CreditNote');

// Cache for models to avoid recreating them
const modelCache = new Map();

/**
 * Get hotel-specific models
 * @param {string} hotelName - Hotel name
 * @returns {Object} - Object containing all hotel-specific models
 */
const getHotelModels = (hotelName) => {
  const schemaName = MultiTenantDB.getSchemaName(hotelName);
  
  // Check cache first
  if (modelCache.has(schemaName)) {
    return modelCache.get(schemaName);
  }

  // Create models with schema
  const models = {
    Payment: createPaymentModel(sequelize, schemaName),
    Booking: createBookingModel(sequelize, schemaName),
    GroupBooking: createGroupBookingModel(sequelize, schemaName),
    WalkinBooking: createWalkinBookingModel(sequelize, schemaName),
    MaintenanceBlock: createMaintenanceBlockModel(sequelize, schemaName),
    Stay: createStayModel(sequelize, schemaName),
    StayCharge: createStayChargeModel(sequelize, schemaName),
    StayApproval: createStayApprovalModel(sequelize, schemaName),
    Guest: createGuestModel(sequelize, schemaName),
    Room: createRoomModel(sequelize, schemaName),
    HousekeepingTask: createHousekeepingTaskModel(sequelize, schemaName),
    MaintenanceRequest: createMaintenanceRequestModel(sequelize, schemaName),
    Feedback: createFeedbackModel(sequelize, schemaName),
    Complaint: createComplaintModel(sequelize, schemaName),
    Inspection: createInspectionModel(sequelize, schemaName),
    LaundryTask: createLaundryTaskModel(sequelize, schemaName),
    LinenItem: createLinenItemModel(sequelize, schemaName),
    LinenUsage: createLinenUsageModel(sequelize, schemaName),
    StaffMember: createStaffMemberModel(sequelize, schemaName),
    StaffSchedule: createStaffScheduleModel(sequelize, schemaName),
    RestaurantBill: createRestaurantBillModel(sequelize, schemaName),
    MenuCategory: createMenuCategoryModel(sequelize, schemaName),
    MenuItem: createMenuItemModel(sequelize, schemaName),
    RestaurantTable: createRestaurantTableModel(sequelize, schemaName),
    TableReservation: createTableReservationModel(sequelize, schemaName),
    ComboOffer: createComboOfferModel(sequelize, schemaName),
    DiscountOffer: createDiscountOfferModel(sequelize, schemaName),
    CouponCode: createCouponCodeModel(sequelize, schemaName),
    KitchenKOT: createKitchenKOTModel(sequelize, schemaName),
    BarOrder: createBarOrderModel(sequelize, schemaName),
    BarInventoryItem: createBarInventoryItemModel(sequelize, schemaName),
    RoomServiceOrder: createRoomServiceOrderModel(sequelize, schemaName),
    TakeawayCustomer: createTakeawayCustomerModel(sequelize, schemaName),
    DeliveryPartner: createDeliveryPartnerModel(sequelize, schemaName),
    DeliveryArea: createDeliveryAreaModel(sequelize, schemaName),
    DeliveryChargesConfig: createDeliveryChargesConfigModel(sequelize, schemaName),
    TakeawayDeliveryOrder: createTakeawayDeliveryOrderModel(sequelize, schemaName),
    TakeawayNotificationLog: createTakeawayNotificationLogModel(sequelize, schemaName),
    HappyHourPricingRule: createHappyHourPricingRuleModel(sequelize, schemaName),
    InventoryItem: createInventoryItemModel(sequelize, schemaName),
    InventoryCategory: createInventoryCategoryModel(sequelize, schemaName),
    StockHistory: createStockHistoryModel(sequelize, schemaName),
    Supplier: createSupplierModel(sequelize, schemaName),
    PurchaseOrder: createPurchaseOrderModel(sequelize, schemaName),
    GRN: createGRNModel(sequelize, schemaName),
    InventoryLocation: createInventoryLocationModel(sequelize, schemaName),
    ItemStockByLocation: createItemStockByLocationModel(sequelize, schemaName),
    StockTransfer: createStockTransferModel(sequelize, schemaName),
    StockAdjustment: createStockAdjustmentModel(sequelize, schemaName),
    StockAlertNotification: createStockAlertNotificationModel(sequelize, schemaName),
    Expense: createExpenseModel(sequelize, schemaName),
    AccountHead: createAccountHeadModel(sequelize, schemaName),
    GuestLedgerEntry: createGuestLedgerEntryModel(sequelize, schemaName),
    AdvancePayment: createAdvancePaymentModel(sequelize, schemaName),
    CashBankAccount: createCashBankAccountModel(sequelize, schemaName),
    CashBankEntry: createCashBankEntryModel(sequelize, schemaName),
    DayClosing: createDayClosingModel(sequelize, schemaName),
    Invoice: createInvoiceModel(sequelize, schemaName),
    CorporateAccount: createCorporateAccountModel(sequelize, schemaName),
    CorporateInvoice: createCorporateInvoiceModel(sequelize, schemaName),
    TaxSetting: createTaxSettingModel(sequelize, schemaName),
    JournalEntry: createJournalEntryModel(sequelize, schemaName),
    RoomBill: createRoomBillModel(sequelize, schemaName),
    Refund: createRefundModel(sequelize, schemaName),
    CreditNote: createCreditNoteModel(sequelize, schemaName),
  };

  // Cache the models
  modelCache.set(schemaName, models);

  return models;
};

module.exports = getHotelModels;
