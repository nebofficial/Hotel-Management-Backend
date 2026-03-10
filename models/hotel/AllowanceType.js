const { DataTypes } = require('sequelize');

const createAllowanceTypeModel = (sequelize, schemaName) => {
  return sequelize.define(
    'AllowanceType',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
      name: { type: DataTypes.STRING, allowNull: false },
      isPercent: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    { tableName: 'allowance_types', schema: schemaName, timestamps: true }
  );
};

module.exports = createAllowanceTypeModel;
