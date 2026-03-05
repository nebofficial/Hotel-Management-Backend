const { sequelize } = require('../config/database');
const createComboOfferModel = require('../models/hotel/ComboOffer');
const createDiscountOfferModel = require('../models/hotel/DiscountOffer');
const createCouponCodeModel = require('../models/hotel/CouponCode');
const { QueryTypes } = require('sequelize');

/**
 * Sync ComboOffer, DiscountOffer, and CouponCode tables for all existing hotel schemas
 */
async function syncComboOfferTables() {
  try {
    const schemas = await sequelize.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'hotel_%'`,
      { type: QueryTypes.SELECT }
    );

    console.log(`Found ${schemas.length} hotel schemas to sync Combo Offer tables`);

    for (const row of schemas) {
      const schemaName = row.schema_name;
      try {
        const ComboOffer = createComboOfferModel(sequelize, schemaName);
        const DiscountOffer = createDiscountOfferModel(sequelize, schemaName);
        const CouponCode = createCouponCodeModel(sequelize, schemaName);
        await ComboOffer.sync({ alter: false });
        await DiscountOffer.sync({ alter: false });
        await CouponCode.sync({ alter: false });
        console.log(`✓ Synced Combo Offer tables for ${schemaName}`);
      } catch (error) {
        console.error(`✗ Failed to sync Combo Offer tables for ${schemaName}:`, error.message);
      }
    }

    console.log('Combo Offer tables sync completed');
  } catch (error) {
    console.error('Error syncing Combo Offer tables:', error);
  }
}

module.exports = syncComboOfferTables;
