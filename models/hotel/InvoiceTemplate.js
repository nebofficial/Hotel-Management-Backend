const { DataTypes } = require('sequelize');

const createInvoiceTemplateModel = (sequelize, schemaName) => {
  return sequelize.define(
    "InvoiceTemplate",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      layoutStyle: {
        // simple string enum, e.g. CLASSIC, COMPACT, DETAILED
        type: DataTypes.STRING(40),
        allowNull: false,
        defaultValue: "CLASSIC",
      },
      isDefault: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      branding: {
        // { logoUrl, brandColor, address }
        type: DataTypes.JSONB || DataTypes.JSON,
        allowNull: true,
      },
      fieldsConfig: {
        // which invoice fields to show/hide/order
        type: DataTypes.JSONB || DataTypes.JSON,
        allowNull: true,
      },
      taxDisplayMode: {
        // DETAILED, TOTAL_ONLY
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "DETAILED",
      },
      footerNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      lastEditedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "invoice_templates",
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ["isDefault"] },
        { fields: ["active"] },
      ],
    }
  );
};

module.exports = createInvoiceTemplateModel;

