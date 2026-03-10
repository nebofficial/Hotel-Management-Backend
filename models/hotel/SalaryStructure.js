const { DataTypes } = require('sequelize');

const createSalaryStructureModel = (sequelize, schemaName) => {
  return sequelize.define(
    'SalaryStructure',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      staffId: { type: DataTypes.UUID, allowNull: false },
      staffName: { type: DataTypes.STRING, allowNull: false },
      basicSalary: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      overtimeRatePerHour: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      effectiveFrom: { type: DataTypes.DATEONLY, allowNull: false },
      effectiveTo: { type: DataTypes.DATEONLY, allowNull: true },
    },
    { tableName: 'salary_structures', schema: schemaName, timestamps: true, indexes: [{ fields: ['staffId'] }] }
  );
};

module.exports = createSalaryStructureModel;
