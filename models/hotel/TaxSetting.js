const { DataTypes } = require('sequelize');

const createTaxSettingModel = (sequelize, schemaName) => {
  return sequelize.define(
    'TaxSetting',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      gstEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      defaultGstRate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 18,
      },
      cgstPercent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 9,
      },
      sgstPercent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 9,
      },
      igstPercent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 18,
      },
      serviceChargeRoom: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
      },
      serviceChargeRestaurant: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: 'tax_settings',
      schema: schemaName,
      timestamps: true,
    }
  );
};

module.exports = createTaxSettingModel;

