const { DataTypes } = require('sequelize');

/**
 * Inspection schema factory for hotel-specific data
 * Stored per-hotel in its own schema.
 */
const createInspectionModel = (sequelize, schemaName) => {
  return sequelize.define(
    'Inspection',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      roomNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      floor: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      roomType: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      inspector: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      scheduledDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      shift: {
        type: DataTypes.ENUM('Morning', 'Afternoon', 'Evening/Night', 'All day'),
        allowNull: false,
        defaultValue: 'All day',
      },
      status: {
        type: DataTypes.ENUM('Pending', 'Completed', 'Issues Reported'),
        allowNull: false,
        defaultValue: 'Pending',
      },
      checklist: {
        // e.g. { cleanliness: 'Passed', maintenance: 'Needs Attention', amenities: 'Passed', linen: 'Failed' }
        type: DataTypes.JSONB,
        allowNull: true,
      },
      issuesSummary: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      issuesCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      cleanedBy: {
        // Last housekeeper who cleaned before inspection
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'inspections',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['roomNumber'] },
        { fields: ['scheduledDate'] },
        { fields: ['status'] },
      ],
    },
  );
};

module.exports = createInspectionModel;

