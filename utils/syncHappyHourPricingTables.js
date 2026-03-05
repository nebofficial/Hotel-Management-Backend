const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

const createHappyHourPricingRuleModel = require('../models/hotel/HappyHourPricingRule');

/**
 * Sync HappyHourPricingRule tables for all existing hotel schemas
 */
async function syncHappyHourPricingTables() {
  try {
    const schemas = await sequelize.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'hotel_%'`,
      { type: QueryTypes.SELECT },
    );

    console.log(`Found ${schemas.length} hotel schemas to sync HappyHourPricingRule tables`);

    for (const row of schemas) {
      const schemaName = row.schema_name;
      try {
        const HappyHourPricingRule = createHappyHourPricingRuleModel(sequelize, schemaName);
        await HappyHourPricingRule.sync({ alter: false });
        console.log(`✓ Synced HappyHourPricingRule for ${schemaName}`);
      } catch (error) {
        console.error(
          `✗ Failed to sync HappyHourPricingRule for ${schemaName}:`,
          error.message,
        );
      }
    }

    console.log('HappyHourPricingRule tables sync completed');
  } catch (error) {
    console.error('Error syncing HappyHourPricingRule tables:', error);
  }
}

module.exports = syncHappyHourPricingTables;

