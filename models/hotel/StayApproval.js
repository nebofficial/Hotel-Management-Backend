const { DataTypes } = require('sequelize');

const createStayApprovalModel = (sequelize, schemaName) => {
  return sequelize.define(
    'StayApproval',
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
      required: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED', 'NOT_REQUIRED'),
        allowNull: false,
        defaultValue: 'NOT_REQUIRED',
      },
      managerName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      decidedBy: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      decidedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      totalCharge: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: 'stay_approvals',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['stayId'] },
        { fields: ['bookingId'] },
        { fields: ['status'] },
      ],
    }
  );
};

module.exports = createStayApprovalModel;

