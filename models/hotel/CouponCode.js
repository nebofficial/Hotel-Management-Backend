const { DataTypes } = require('sequelize');

/**
 * CouponCode schema factory for hotel-specific data
 * Manages coupon codes for discounts
 */
const createCouponCodeModel = (sequelize, schemaName) => {
  return sequelize.define(
    'CouponCode',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      discountType: {
        type: DataTypes.ENUM('Percentage', 'Flat'),
        allowNull: false,
        defaultValue: 'Percentage',
      },
      discountValue: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      minOrderValue: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      maxDiscountAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      maxUses: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      usedCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      maxUsesPerUser: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      applicableItems: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null,
      },
      applicableCategories: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      tableName: 'coupon_codes',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['code'] },
        { fields: ['isActive'] },
        { fields: ['startDate', 'endDate'] },
      ],
    },
  );
};

module.exports = createCouponCodeModel;
