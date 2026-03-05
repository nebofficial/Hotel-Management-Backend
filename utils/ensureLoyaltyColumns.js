const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

async function ensureLoyaltyColumns() {
  try {
    const schemas = await sequelize.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'hotel_%'`,
      { type: QueryTypes.SELECT }
    );

    if (!Array.isArray(schemas) || schemas.length === 0) return;

    for (const row of schemas) {
      const schemaName = row && row.schema_name ? String(row.schema_name) : '';
      if (!schemaName) continue;
      try {
        // Add loyalty columns to guests table if they don't exist
        await sequelize.query(
          `ALTER TABLE "${schemaName}"."guests" ADD COLUMN IF NOT EXISTS "loyaltyTier" VARCHAR(255)`
        );
        await sequelize.query(
          `ALTER TABLE "${schemaName}"."guests" ADD COLUMN IF NOT EXISTS "loyaltyTotalStays" INTEGER NOT NULL DEFAULT 0`
        );
        await sequelize.query(
          `ALTER TABLE "${schemaName}"."guests" ADD COLUMN IF NOT EXISTS "loyaltyTotalSpent" DECIMAL(10,2) NOT NULL DEFAULT 0`
        );
        await sequelize.query(
          `ALTER TABLE "${schemaName}"."guests" ADD COLUMN IF NOT EXISTS "loyaltyLastUpdated" TIMESTAMP WITH TIME ZONE`
        );
      } catch (e) {
        console.warn(
          `[Migration] ensureLoyaltyColumns skipped schema "${schemaName}":`,
          e.message
        );
      }
    }
  } catch (error) {
    console.warn('[Migration] ensureLoyaltyColumns failed:', error.message);
  }
}

module.exports = { ensureLoyaltyColumns };

