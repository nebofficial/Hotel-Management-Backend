const { DataTypes } = require('sequelize');

const createInvoiceModel = (sequelize, schemaName) => {
  return sequelize.define(
    'Invoice',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      invoiceNumber: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true,
      },
      bookingId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      guestId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      guestName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      issueDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('PAID', 'PENDING', 'OVERDUE', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'USD',
      },
      subtotal: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      taxAmount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      totalAmount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      taxPercent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      items: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
    },
    {
      tableName: 'invoices',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['invoiceNumber'], unique: true },
        { fields: ['issueDate'] },
        { fields: ['status'] },
      ],
    }
  );
};

module.exports = createInvoiceModel;

