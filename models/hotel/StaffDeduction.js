const { DataTypes } = require('sequelize');

function createStaffDeductionModel(sequelize, schemaName) {
  return sequelize.define(
    'StaffDeduction',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      staffId: { type: DataTypes.UUID, allowNull: false },
      deductionTypeId: { type: DataTypes.UUID, allowNull: false },
      value: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    },
    { tableName: 'staff_deductions', schema: schemaName, timestamps: true }
  );
}

module.exports = createStaffDeductionModel;
