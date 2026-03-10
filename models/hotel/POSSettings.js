const { DataTypes } = require('sequelize');

const createPOSSettingsModel = (sequelize, schemaName) => {
  return sequelize.define(
    "POSSettings",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      defaultTerminalName: {
        type: DataTypes.STRING(120),
        allowNull: false,
        defaultValue: "Main POS",
      },
      terminalLocation: {
        // RESTAURANT / BAR / ROOM_SERVICE etc.
        type: DataTypes.STRING(40),
        allowNull: false,
        defaultValue: "RESTAURANT",
      },
      autoLoginEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      printerConfig: {
        // { device, type, autoPrint }
        type: DataTypes.JSONB || DataTypes.JSON,
        allowNull: true,
      },
      tableLayout: {
        // { tables: [{ id, name, capacity, zone }] }
        type: DataTypes.JSONB || DataTypes.JSON,
        allowNull: true,
      },
      menuCategories: {
        // [{ id, name, sortOrder }]
        type: DataTypes.JSONB || DataTypes.JSON,
        allowNull: true,
      },
      orderNotifications: {
        // { kitchenAlerts, soundAlerts, screenPopups }
        type: DataTypes.JSONB || DataTypes.JSON,
        allowNull: true,
      },
      taxSettings: {
        // { applyGST, applyServiceCharge, taxInclusive }
        type: DataTypes.JSONB || DataTypes.JSON,
        allowNull: true,
      },
      receiptFormat: {
        // { header, showOrderDetails, showTaxBreakdown, footerMessage }
        type: DataTypes.JSONB || DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      tableName: "pos_settings",
      schema: schemaName,
      timestamps: true,
    }
  );
};

module.exports = createPOSSettingsModel;

