const { DataTypes } = require('sequelize');

function createDeductionTypeModel(sequelize, schemaName) {
  return sequelize.define(
    'DeductionType',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      code: { type: DataTypes.STRING(20), allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      isPercent: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    { tableName: 'deduction_types', schema: schemaName, timestamps: true }
  );
}

module.exports = createDeductionTypeModel;
