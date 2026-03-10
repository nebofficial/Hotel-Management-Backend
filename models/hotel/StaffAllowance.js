const { DataTypes } = require('sequelize');

function createStaffAllowanceModel(sequelize, schemaName) {
  return sequelize.define(
    'StaffAllowance',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      staffId: { type: DataTypes.UUID, allowNull: false },
      allowanceTypeId: { type: DataTypes.UUID, allowNull: false },
      value: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    },
    { tableName: 'staff_allowances', schema: schemaName, timestamps: true }
  );
}

module.exports = createStaffAllowanceModel;
