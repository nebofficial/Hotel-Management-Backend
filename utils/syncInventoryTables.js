const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

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

/**
 * Sync Inventory tables for all existing hotel schemas
 */
async function syncInventoryTables() {
  try {
    const schemas = await sequelize.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'hotel_%'`,
      { type: QueryTypes.SELECT },
    );

    console.log(`Found ${schemas.length} hotel schemas to sync Inventory tables`);

    for (const row of schemas) {
      const schemaName = row.schema_name;
      try {
        const InventoryItem = createInventoryItemModel(sequelize, schemaName);
        const InventoryCategory = createInventoryCategoryModel(sequelize, schemaName);
        const StockHistory = createStockHistoryModel(sequelize, schemaName);
        const Supplier = createSupplierModel(sequelize, schemaName);
        const PurchaseOrder = createPurchaseOrderModel(sequelize, schemaName);
        const GRN = createGRNModel(sequelize, schemaName);
        const InventoryLocation = createInventoryLocationModel(sequelize, schemaName);
        const ItemStockByLocation = createItemStockByLocationModel(sequelize, schemaName);
        const StockTransfer = createStockTransferModel(sequelize, schemaName);
        const StockAdjustment = createStockAdjustmentModel(sequelize, schemaName);
        const StockAlertNotification = createStockAlertNotificationModel(sequelize, schemaName);
        // NOTE: alter:true can fail on some Postgres setups with enum/constraint duplicates.
        // We keep it safe here to avoid blocking backend startup.
        await InventoryCategory.sync({ alter: false });
        await InventoryItem.sync({ alter: false });
        await StockHistory.sync({ alter: false });
        await Supplier.sync({ alter: false });
        await PurchaseOrder.sync({ alter: false });
        await GRN.sync({ alter: false });
        await InventoryLocation.sync({ alter: false });
        await ItemStockByLocation.sync({ alter: false });
        await StockTransfer.sync({ alter: false });
        await StockAdjustment.sync({ alter: false });
        await StockAlertNotification.sync({ alter: false });
        console.log(`✓ Synced Inventory tables for ${schemaName}`);
      } catch (error) {
        console.error(
          `✗ Failed to sync Inventory tables for ${schemaName}:`,
          error.message,
        );
      }
    }

    console.log('Inventory tables sync completed');
  } catch (error) {
    console.error('Error syncing Inventory tables:', error);
  }
}

module.exports = syncInventoryTables;
