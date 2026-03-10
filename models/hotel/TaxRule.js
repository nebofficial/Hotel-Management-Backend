const { DataTypes } = require('sequelize');

const createTaxRuleModel = (sequelize, schemaName) => {
  return sequelize.define(
    'TaxRule',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      type: {
        // GST, VAT, SERVICE, CITY
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      percentage: {
        type: DataTypes.DECIMAL(7, 3),
        allowNull: true,
      },
      scope: {
        // rooms, services, both
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'rooms',
      },
      cityTaxMode: {
        // per_night, per_guest, fixed - used when type === CITY
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      cityTaxAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      priority: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'tax_rules',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['type'] },
        { fields: ['scope'] },
        { fields: ['priority'] },
        { fields: ['active'] },
      ],
    }
  );
};

module.exports = createTaxRuleModel;

