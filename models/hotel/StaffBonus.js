const { DataTypes } = require('sequelize');

function createStaffBonusModel(sequelize, schemaName) {
  return sequelize.define(
    'StaffBonus',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      staffId: { type: DataTypes.UUID, allowNull: false },
      staffName: { type: DataTypes.STRING, allowNull: false },
      month: { type: DataTypes.INTEGER, allowNull: false },
      year: { type: DataTypes.INTEGER, allowNull: false },
      amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      reason: { type: DataTypes.STRING, allowNull: true },
    },
    { tableName: 'staff_bonuses', schema: schemaName, timestamps: true }
  );
}

module.exports = createStaffBonusModel;
