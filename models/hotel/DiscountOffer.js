const { DataTypes } = require('sequelize');

/**
 * DiscountOffer schema factory for hotel-specific data
 * Manages percentage and flat discount offers
 */
const createDiscountOfferModel = (sequelize, schemaName) => {
  return sequelize.define(
    'DiscountOffer',
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
      discountType: {
        type: DataTypes.ENUM('Percentage', 'Flat'),
        allowNull: false,
        defaultValue: 'Percentage',
      },
      discountValue: {
        // Percentage (0-100) or flat amount
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      minOrderValue: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      maxDiscountAmount: {
        // For percentage discounts
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      applicableItems: {
        // JSON array of menu item IDs (null = all items)
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null,
      },
      applicableCategories: {
        // JSON array of category IDs (null = all categories)
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null,
      },
      priority: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
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
      startTime: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      endTime: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      limitedQuantity: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      usedQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      autoApply: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'discount_offers',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['name'] },
        { fields: ['isActive'] },
        { fields: ['priority'] },
        { fields: ['startDate', 'endDate'] },
      ],
    },
  );
};

module.exports = createDiscountOfferModel;
