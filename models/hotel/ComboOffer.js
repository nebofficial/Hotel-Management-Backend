const { DataTypes } = require('sequelize');

/**
 * ComboOffer schema factory for hotel-specific data
 * Manages combo meals with multiple items and pricing
 */
const createComboOfferModel = (sequelize, schemaName) => {
  return sequelize.define(
    'ComboOffer',
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
      items: {
        // JSON array: [{ menuItemId, name, quantity, price }]
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      comboPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      originalPrice: {
        // Sum of individual item prices
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      discountAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      discountPercentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      imageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      displayOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: 'combo_offers',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['name'] },
        { fields: ['isActive'] },
        { fields: ['displayOrder'] },
      ],
    },
  );
};

module.exports = createComboOfferModel;
