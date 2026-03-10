const { DataTypes } = require('sequelize');

const createCommissionTransactionModel = (sequelize, schemaName) => {
  return sequelize.define(
    'CommissionTransaction',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      staffId: { type: DataTypes.UUID, allowNull: false },
      staffName: { type: DataTypes.STRING, allowNull: false },
      department: { type: DataTypes.STRING, allowNull: true },
      ruleId: { type: DataTypes.UUID, allowNull: false },
      ruleName: { type: DataTypes.STRING, allowNull: false },
      serviceType: { type: DataTypes.STRING, allowNull: false },
      baseAmount: { type: DataTypes.DECIMAL(12,2), allowNull: false },
      commissionAmount: { type: DataTypes.DECIMAL(12,2), allowNull: false },
      transactionDate: { type: DataTypes.DATEONLY, allowNull: false },
      status: { type: DataTypes.ENUM('pending','paid','overdue'), allowNull: false, defaultValue: 'pending' },
      paidAt: { type: DataTypes.DATE, allowNull: true },
      paymentMethod: { type: DataTypes.STRING, allowNull: true },
      paymentReference: { type: DataTypes.STRING, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      tableName: 'commission_transactions',
      schema: schemaName,
      timestamps: true,
      indexes: [{ fields: ['staffId'] }, { fields: ['ruleId'] }, { fields: ['transactionDate'] }, { fields: ['status'] }],
    },
  );
};

module.exports = createCommissionTransactionModel;
