const { DataTypes } = require('sequelize');

const createPayrollRunModel = (sequelize, schemaName) => {
  return sequelize.define(
    'PayrollRun',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      month: { type: DataTypes.INTEGER, allowNull: false },
      year: { type: DataTypes.INTEGER, allowNull: false },
      status: { type: DataTypes.ENUM('draft', 'finalized'), allowNull: false, defaultValue: 'draft' },
      department: { type: DataTypes.STRING, allowNull: true },
      totalAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
    },
    { tableName: 'payroll_runs', schema: schemaName, timestamps: true, indexes: [{ fields: ['month', 'year'] }] }
  );
};

module.exports = createPayrollRunModel;
