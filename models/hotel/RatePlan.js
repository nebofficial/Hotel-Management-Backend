const { DataTypes } = require('sequelize');

/**
 * RatePlan schema factory for hotel-specific data
 * Stored in each hotel's separate schema
 */
const createRatePlanModel = (sequelize, schemaName) => {
  return sequelize.define(
    'RatePlan',
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
      roomTypes: {
        // List of room type names this plan applies to
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
      basePrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      mealPlan: {
        type: DataTypes.ENUM('room_only', 'breakfast', 'half_board', 'full_board'),
        allowNull: false,
        defaultValue: 'room_only',
      },
      isRefundable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      nonRefundableDiscountPercent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      minStayNights: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      maxStayNights: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      weekendRule: {
        // e.g. { weekendOnly: false, extraNights: 0 }
        type: DataTypes.JSONB,
        allowNull: true,
      },
      seasonalRules: {
        // e.g. [{ season: 'peak', from: '2024-12-01', to: '2025-01-15', upliftPercent: 15 }]
        type: DataTypes.JSONB,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
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
      tableName: 'rate_plans',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['name'] },
        { fields: ['status'] },
      ],
    },
  );
};

module.exports = createRatePlanModel;

