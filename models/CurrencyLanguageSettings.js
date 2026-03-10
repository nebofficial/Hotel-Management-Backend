const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * CurrencyLanguageSettings
 * Per-hotel currency format, exchange rates, language, date/time and number format preferences.
 */
const CurrencyLanguageSettings = sequelize.define(
  'CurrencyLanguageSettings',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    hotelId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    decimalPrecision: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 2 },
    thousandsSeparator: { type: DataTypes.STRING(10), allowNull: true },
    decimalSeparator: { type: DataTypes.STRING(10), allowNull: true },
    currencyRounding: { type: DataTypes.STRING(50), allowNull: true },
    exchangeRates: { type: DataTypes.TEXT, allowNull: true }, // JSON string: { "USD_EUR": 0.92, "lastUpdated": "..." }
    enabledLanguages: { type: DataTypes.TEXT, allowNull: true }, // JSON array: ["en","ar","es","fr"]
    defaultLanguage: { type: DataTypes.STRING(20), allowNull: true },
    autoTimeSync: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true },
  },
  {
    tableName: 'currency_language_settings',
    timestamps: true,
    indexes: [{ fields: ['hotelId'] }],
  }
);

module.exports = CurrencyLanguageSettings;
