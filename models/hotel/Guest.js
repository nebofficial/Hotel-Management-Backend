const { DataTypes } = require('sequelize');

/**
 * Guest schema factory for hotel-specific data
 * This will be stored in each hotel's separate schema
 */
const createGuestModel = (sequelize, schemaName) => {
  return sequelize.define('Guest', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    dateOfBirth: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    idType: {
      type: DataTypes.ENUM('passport', 'driving_license', 'national_id', 'other'),
      allowNull: true,
    },
    idNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    preferences: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    loyaltyPoints: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    // Loyalty program fields
    loyaltyTier: {
      // e.g. 'Silver', 'Gold', 'Platinum'
      type: DataTypes.STRING,
      allowNull: true,
    },
    loyaltyTotalStays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    loyaltyTotalSpent: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    loyaltyLastUpdated: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    creditLimit: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      comment: 'Guest credit limit for ledger posting',
    },
  }, {
    tableName: 'guests',
    schema: schemaName,
    timestamps: true,
    indexes: [
      { fields: ['email'] },
      { fields: ['phone'] },
      { fields: ['lastName', 'firstName'] },
    ],
  });
};

module.exports = createGuestModel;
