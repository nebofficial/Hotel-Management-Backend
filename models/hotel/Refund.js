const { DataTypes } = require('sequelize');

const createRefundModel = (sequelize, schemaName) => {
  return sequelize.define(
    'Refund',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      bookingId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      paymentId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      method: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      reference: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED'),
        allowNull: false,
        defaultValue: 'COMPLETED',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'refunds',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['bookingId'] },
        { fields: ['paymentId'] },
        { fields: ['status'] },
      ],
    }
  );
};

module.exports = createRefundModel;

