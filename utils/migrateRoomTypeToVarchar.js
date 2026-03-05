/**
 * Migrate rooms.roomType from ENUM to VARCHAR in all hotel schemas
 * so values like "Single", "Double", "Deluxe", "Suite" are accepted.
 */
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

async function migrateRoomTypeToVarchar() {
  try {
    const schemas = await sequelize.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'hotel_%'`,
      { type: QueryTypes.SELECT }
    );
    if (!Array.isArray(schemas)) return;
    for (const row of schemas) {
      const schemaName = row.schema_name;
      try {
        await sequelize.query(
          `ALTER TABLE "${schemaName}"."rooms" ALTER COLUMN "roomType" TYPE VARCHAR(255) USING "roomType"::text`,
          { type: QueryTypes.RAW }
        );
        console.log(`[Migration] roomType -> VARCHAR in schema: ${schemaName}`);
      } catch (err) {
        const msg = err.message || '';
        if (msg.includes('already') || msg.includes('does not exist')) {
          // Column already varchar or table missing, skip
        } else {
          console.warn(`[Migration] ${schemaName}:`, msg);
        }
      }
    }
  } catch (error) {
    console.warn('[Migration] migrateRoomTypeToVarchar failed:', error.message);
  }
}

module.exports = { migrateRoomTypeToVarchar };
