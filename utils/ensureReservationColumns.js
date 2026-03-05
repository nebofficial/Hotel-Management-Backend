const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

async function ensureReservationColumns() {
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
        await sequelize.query(
          `ALTER TABLE "${schemaName}"."bookings" ADD COLUMN IF NOT EXISTS "isTentative" BOOLEAN NOT NULL DEFAULT false`
        );
        await sequelize.query(
          `ALTER TABLE "${schemaName}"."bookings" ADD COLUMN IF NOT EXISTS "roomType" VARCHAR(255)`
        );
        await sequelize.query(
          `ALTER TABLE "${schemaName}"."bookings" ADD COLUMN IF NOT EXISTS "ratePlan" VARCHAR(255)`
        );
        await sequelize.query(
          `ALTER TABLE "${schemaName}"."bookings" ADD COLUMN IF NOT EXISTS "pricingBreakdown" JSONB DEFAULT '{}'::jsonb`
        );
        await sequelize.query(
          `ALTER TABLE "${schemaName}"."bookings" ADD COLUMN IF NOT EXISTS "extras" JSONB DEFAULT '{}'::jsonb`
        );
        await sequelize.query(
          `ALTER TABLE "${schemaName}"."bookings" ADD COLUMN IF NOT EXISTS "roomCostTotal" DECIMAL(10,2)`
        );
        await sequelize.query(
          `ALTER TABLE "${schemaName}"."bookings" ADD COLUMN IF NOT EXISTS "extrasCostTotal" DECIMAL(10,2)`
        );
        await sequelize.query(
          `ALTER TABLE "${schemaName}"."bookings" ADD COLUMN IF NOT EXISTS "advancePaid" DECIMAL(10,2) NOT NULL DEFAULT 0`
        );
        await sequelize.query(
          `ALTER TABLE "${schemaName}"."bookings" ADD COLUMN IF NOT EXISTS "balanceAmount" DECIMAL(10,2)`
        );
        await sequelize.query(
          `ALTER TABLE "${schemaName}"."bookings" ADD COLUMN IF NOT EXISTS "paymentMode" VARCHAR(255)`
        );
        await sequelize.query(
          `ALTER TABLE "${schemaName}"."bookings" ADD COLUMN IF NOT EXISTS "cancelReason" TEXT`
        );
        await sequelize.query(
          `ALTER TABLE "${schemaName}"."bookings" ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP WITH TIME ZONE`
        );
        await sequelize.query(
          `ALTER TABLE "${schemaName}"."bookings" ADD COLUMN IF NOT EXISTS "isNoShow" BOOLEAN NOT NULL DEFAULT false`
        );
      } catch (e) {
        console.warn(
          `[Migration] ensureReservationColumns skipped schema "${schemaName}":`,
          e.message
        );
      }
    }
  } catch (error) {
    console.warn('[Migration] ensureReservationColumns failed:', error.message);
  }
}

module.exports = { ensureReservationColumns };

