const { DataTypes } = require('sequelize');

/**
 * HappyHourPricingRule schema factory for hotel-specific data
 * Central config for all happy-hour / time-based pricing rules
 */
const createHappyHourPricingRuleModel = (sequelize, schemaName) => {
  return sequelize.define(
    'HappyHourPricingRule',
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
      // Time window in a day (local time, HH:mm)
      startTime: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      endTime: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      // Optional multiple slots in a day: [{ start: "17:00", end: "18:30" }, ...]
      slots: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      // Days of week this rule applies to, e.g. ["Mon","Tue","Wed"]
      daysOfWeek: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
      weekendOnly: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // Discount config
      discountType: {
        type: DataTypes.ENUM('percent', 'fixed'),
        allowNull: false,
        defaultValue: 'percent',
      },
      discountValue: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      // Scope of items affected - generic product IDs (MenuItem / BarInventoryItem)
      productIds: {
        // array of strings (ids)
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
      barOnly: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      autoRevert: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      autoActivate: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      autoDeactivate: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      validFrom: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      validTo: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'happy_hour_pricing_rules',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['isActive'] },
        { fields: ['barOnly'] },
        { fields: ['startTime'] },
        { fields: ['endTime'] },
        { fields: ['validFrom'] },
        { fields: ['validTo'] },
      ],
    },
  );
};

module.exports = createHappyHourPricingRuleModel;

