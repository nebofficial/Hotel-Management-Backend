const { DataTypes } = require('sequelize');

const createLeaveRequestModel = (sequelize, schemaName) => {
  return sequelize.define(
    'LeaveRequest',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      staffId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      staffName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      department: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      leaveType: {
        type: DataTypes.ENUM('Sick', 'Casual', 'Annual', 'Unpaid', 'Other'),
        allowNull: false,
        defaultValue: 'Casual',
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Cancelled'),
        allowNull: false,
        defaultValue: 'Pending',
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      approverName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'leave_requests',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['staffId'] },
        { fields: ['department'] },
        { fields: ['startDate'] },
        { fields: ['status'] },
      ],
    },
  );
};

module.exports = createLeaveRequestModel;

