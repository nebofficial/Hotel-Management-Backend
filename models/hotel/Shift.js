const { DataTypes } = require('sequelize');

/**
 * Shift schema - shift definitions (Morning, Evening, Night, etc.)
 */
const createShiftModel = (sequelize, schemaName) => {
  return sequelize.define(
    'Shift',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      shiftId: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      startTime: {
        type: DataTypes.STRING(5),
        allowNull: false,
      },
      endTime: {
        type: DataTypes.STRING(5),
        allowNull: false,
      },
      breakMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      isNightShift: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      shiftType: {
        type: DataTypes.ENUM('Morning', 'Evening', 'Night'),
        allowNull: false,
        defaultValue: 'Morning',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'shifts',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['shiftId'] },
        { fields: ['isActive'] },
        { fields: ['shiftType'] },
      ],
    }
  );
};

module.exports = createShiftModel;
