const { DataTypes } = require('sequelize');

const createDepartmentModel = (sequelize, schemaName) => {
  return sequelize.define(
    'Department',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'departments',
      schema: schemaName,
      timestamps: true,
      indexes: [{ fields: ['name'] }, { fields: ['isActive'] }],
    },
  );
};

module.exports = createDepartmentModel;

