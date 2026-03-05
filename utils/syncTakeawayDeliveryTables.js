const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

const createTakeawayCustomerModel = require('../models/hotel/TakeawayCustomer');
const createDeliveryPartnerModel = require('../models/hotel/DeliveryPartner');
const createDeliveryAreaModel = require('../models/hotel/DeliveryArea');
const createDeliveryChargesConfigModel = require('../models/hotel/DeliveryChargesConfig');
const createTakeawayDeliveryOrderModel = require('../models/hotel/TakeawayDeliveryOrder');
const createTakeawayNotificationLogModel = require('../models/hotel/TakeawayNotificationLog');

/**
 * Sync Takeaway/Delivery tables for all existing hotel schemas
 */
async function syncTakeawayDeliveryTables() {
  try {
    const schemas = await sequelize.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'hotel_%'`,
      { type: QueryTypes.SELECT },
    );

    console.log(`Found ${schemas.length} hotel schemas to sync Takeaway/Delivery tables`);

    for (const row of schemas) {
      const schemaName = row.schema_name;
      try {
        const TakeawayCustomer = createTakeawayCustomerModel(sequelize, schemaName);
        const DeliveryPartner = createDeliveryPartnerModel(sequelize, schemaName);
        const DeliveryArea = createDeliveryAreaModel(sequelize, schemaName);
        const DeliveryChargesConfig = createDeliveryChargesConfigModel(sequelize, schemaName);
        const TakeawayDeliveryOrder = createTakeawayDeliveryOrderModel(sequelize, schemaName);
        const TakeawayNotificationLog = createTakeawayNotificationLogModel(sequelize, schemaName);

        await TakeawayCustomer.sync({ alter: false });
        await DeliveryPartner.sync({ alter: false });
        await DeliveryArea.sync({ alter: false });
        await DeliveryChargesConfig.sync({ alter: false });
        await TakeawayDeliveryOrder.sync({ alter: false });
        await TakeawayNotificationLog.sync({ alter: false });

        console.log(`✓ Synced Takeaway/Delivery tables for ${schemaName}`);
      } catch (error) {
        console.error(
          `✗ Failed to sync Takeaway/Delivery tables for ${schemaName}:`,
          error.message,
        );
      }
    }

    console.log('Takeaway/Delivery tables sync completed');
  } catch (error) {
    console.error('Error syncing Takeaway/Delivery tables:', error);
  }
}

module.exports = syncTakeawayDeliveryTables;
