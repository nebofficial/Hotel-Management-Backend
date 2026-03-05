/**
 * One-time migration: change rooms.roomType from ENUM to VARCHAR
 * so values like "Single", "Double", "Deluxe", "Suite" are accepted.
 * Run: node scripts/migrateRoomTypeToVarchar.js
 */
require('dotenv').config();
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

async function migrate() {
  try {
    await sequelize.authenticate();
    const [schemas] = await sequelize.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'hotel_%'`,
      { type: QueryTypes.SELECT }
    );
    for (const row of schemas) {
      const schemaName = row.schema_name;
      try {
        await sequelize.query(
          `ALTER TABLE "${schemaName}"."rooms" ALTER COLUMN "roomType" TYPE VARCHAR(255) USING "roomType"::text`,
          { type: QueryTypes.RAW }
        );
        console.log(`Migrated roomType to VARCHAR in schema: ${schemaName}`);
      } catch (err) {
        if (err.message && err.message.includes('type "varchar"')) {
          console.log(`Schema ${schemaName}: roomType already VARCHAR, skip`);
        } else {
          console.error(`Schema ${schemaName}:`, err.message);
        }
      }
    }
    console.log('Migration done.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
