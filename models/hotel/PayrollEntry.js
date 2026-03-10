const { DataTypes } = require('sequelize');

const createPayrollEntryModel = (sequelize, schemaName) => {
  return sequelize.define(
    'PayrollEntry',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      payrollRunId: { type: DataTypes.UUID, allowNull: false },
      staffId: { type: DataTypes.UUID, allowNull: false },
      staffName: { type: DataTypes.STRING, allowNull: false },
      department: { type: DataTypes.STRING, allowNull: true },
      basicSalary: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      allowancesTotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      deductionsTotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      overtimePay: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      bonusAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      leaveDeduction: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      grossSalary: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      netSalary: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      allowancesBreakdown: { type: DataTypes.JSON, allowNull: true },
      deductionsBreakdown: { type: DataTypes.JSON, allowNull: true },
      status: { type: DataTypes.ENUM('pending', 'processing', 'paid'), allowNull: false, defaultValue: 'pending' },
      paidAt: { type: DataTypes.DATE, allowNull: true },
      paymentMethod: { type: DataTypes.STRING, allowNull: true },
      paymentReference: { type: DataTypes.STRING, allowNull: true },
    },
    { tableName: 'payroll_entries', schema: schemaName, timestamps: true, indexes: [{ fields: ['payrollRunId'] }, { fields: ['staffId'] }] }
  );
};

module.exports = createPayrollEntryModel;
