const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

/**
 * Ensure Feedback and Complaint tables exist for ALL existing hotel schemas.
 * Needed because many schemas were created before these models existed.
 */
async function ensureFeedbackTables() {
  try {
    const schemas = await sequelize.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'hotel_%'`,
      { type: QueryTypes.SELECT }
    );

    if (!Array.isArray(schemas) || schemas.length === 0) return;

    const createFeedbackModel = require('../models/hotel/Feedback');
    const createComplaintModel = require('../models/hotel/Complaint');

    for (const row of schemas) {
      const schemaName = row && row.schema_name ? String(row.schema_name) : '';
      if (!schemaName) continue;

      try {
        const Feedback = createFeedbackModel(sequelize, schemaName);
        const Complaint = createComplaintModel(sequelize, schemaName);

        await Feedback.sync({ alter: false });
        await Complaint.sync({ alter: false });
      } catch (e) {
        console.warn(
          `[Migration] ensureFeedbackTables skipped schema "${schemaName}":`,
          e.message
        );
      }
    }
  } catch (error) {
    console.warn('[Migration] ensureFeedbackTables failed:', error.message);
  }
}

module.exports = { ensureFeedbackTables };

