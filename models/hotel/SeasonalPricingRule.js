const { DataTypes } = require('sequelize');

/**
 * SeasonalPricingRule schema factory for hotel-specific data
 * Stored in each hotel's separate schema
 */
const createSeasonalPricingRuleModel = (sequelize, schemaName) => {
  return sequelize.define(
    'SeasonalPricingRule',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      roomTypes: {
        // List of room type names this rule applies to
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
      adjustmentPercent: {
        // Positive number; sign determined by adjustmentType
        type: DataTypes.DECIMAL(6, 2),
        allowNull: false,
      },
      adjustmentType: {
        type: DataTypes.ENUM('increase', 'discount'),
        allowNull: false,
        defaultValue: 'increase',
      },
      ruleType: {
        // season, holiday, weekend, dynamic
        type: DataTypes.ENUM('season', 'holiday', 'weekend', 'dynamic'),
        allowNull: false,
        defaultValue: 'season',
      },
      weekendDays: {
        // For weekend rules: array like ['fri','sat','sun']
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      metadata: {
        // For dynamic / event-based extra config
        type: DataTypes.JSONB,
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      updatedBy: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'seasonal_pricing_rules',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['name'] },
        { fields: ['ruleType'] },
        { fields: ['isActive'] },
        { fields: ['startDate', 'endDate'] },
      ],
    },
  );
};

module.exports = createSeasonalPricingRuleModel;

