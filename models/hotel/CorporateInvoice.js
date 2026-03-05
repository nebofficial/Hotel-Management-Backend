const { DataTypes } = require('sequelize');

const createCorporateInvoiceModel = (sequelize, schemaName) => {
  return sequelize.define(
    'CorporateInvoice',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      invoiceNumber: {
        type: DataTypes.STRING(32),
        allowNull: false,
        unique: true,
      },
      corporateAccountId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      periodStart: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      periodEnd: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      totalAmount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      paidAmount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'PARTIAL', 'PAID', 'OVERDUE'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      details: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      tableName: 'corporate_invoices',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['invoiceNumber'], unique: true },
        { fields: ['corporateAccountId'] },
        { fields: ['status'] },
      ],
    },
  );
};

module.exports = createCorporateInvoiceModel;

