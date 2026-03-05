const { DataTypes } = require('sequelize');

const createStayChargeModel = (sequelize, schemaName) => {
  return sequelize.define(
    'StayCharge',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      stayId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      bookingId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('early_checkin', 'late_checkout', 'both'),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      hoursEarly: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: false,
        defaultValue: 0,
      },
      hoursLate: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: false,
        defaultValue: 0,
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      appliedToBillId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'stay_charges',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['stayId'] },
        { fields: ['bookingId'] },
        { fields: ['type'] },
      ],
    }
  );
};

module.exports = createStayChargeModel;

