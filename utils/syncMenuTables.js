const { sequelize } = require('../config/database');
const createMenuCategoryModel = require('../models/hotel/MenuCategory');
const createMenuItemModel = require('../models/hotel/MenuItem');
const { QueryTypes } = require('sequelize');

/**
 * Sync MenuCategory and MenuItem tables for all existing hotel schemas
 */
async function syncMenuTables() {
  try {
    const schemas = await sequelize.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'hotel_%'`,
      { type: QueryTypes.SELECT }
    );

    console.log(`Found ${schemas.length} hotel schemas to sync Menu tables`);

    for (const row of schemas) {
      const schemaName = row.schema_name;
      try {
        const MenuCategory = createMenuCategoryModel(sequelize, schemaName);
        const MenuItem = createMenuItemModel(sequelize, schemaName);
        await MenuCategory.sync({ alter: false });
        await MenuItem.sync({ alter: false });
        console.log(`✓ Synced Menu tables for ${schemaName}`);
      } catch (error) {
        console.error(`✗ Failed to sync Menu tables for ${schemaName}:`, error.message);
      }
    }

    console.log('Menu tables sync completed');
  } catch (error) {
    console.error('Error syncing Menu tables:', error);
  }
}

module.exports = syncMenuTables;
