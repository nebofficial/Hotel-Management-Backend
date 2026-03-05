const { DataTypes } = require('sequelize');

/**
 * Expense schema for hotel finance tracking
 * Stored in each hotel's schema
 */
const createExpenseModel = (sequelize, schemaName) => {
  return sequelize.define(
    'Expense',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'e.g. Salary, Utilities, Supplies, Maintenance, Marketing, Other',
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING,
        defaultValue: 'USD',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      expenseDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      paymentMethod: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      vendor: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('Pending', 'Paid', 'Rejected'),
        defaultValue: 'Paid',
      },
    },
    {
      tableName: 'expenses',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['category'] },
        { fields: ['expenseDate'] },
        { fields: ['createdAt'] },
      ],
    }
  );
};

module.exports = createExpenseModel;
