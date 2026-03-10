const { DataTypes } = require('sequelize');

const createCommissionRuleModel = (sequelize, schemaName) => {
  return sequelize.define(
    'CommissionRule',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      serviceType: { type: DataTypes.STRING, allowNull: false },
      commissionType: { type: DataTypes.ENUM('PERCENT','FIXED'), allowNull: false, defaultValue: 'PERCENT' },
      value: { type: DataTypes.DECIMAL(10,2), allowNull: false },
      appliesTo: { type: DataTypes.ENUM('GLOBAL','STAFF','DEPARTMENT'), allowNull: false, defaultValue: 'GLOBAL' },
      staffId: { type: DataTypes.UUID, allowNull: true },
      staffName: { type: DataTypes.STRING, allowNull: true },
      department: { type: DataTypes.STRING, allowNull: true },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      tableName: 'commission_rules',
      schema: schemaName,
      timestamps: true,
      indexes: [{ fields: ['serviceType'] }, { fields: ['appliesTo'] }, { fields: ['staffId'] }, { fields: ['department'] }],
    },
  );
};

module.exports = createCommissionRuleModel;
