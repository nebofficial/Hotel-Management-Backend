const { DataTypes } = require('sequelize');

const createThemeSettingsModel = (sequelize, schemaName) => {
  return sequelize.define(
    'ThemeSettings',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      themeName: {
        type: DataTypes.ENUM('default', 'corporate', 'modern', 'minimal'),
        allowNull: false,
        defaultValue: 'default',
      },
      mode: {
        type: DataTypes.ENUM('light', 'dark', 'system'),
        allowNull: false,
        defaultValue: 'light',
      },
      brandColors: {
        // { primary, secondary, accent, background }
        type: DataTypes.JSONB || DataTypes.JSON,
        allowNull: true,
      },
      fontSettings: {
        // { family, size, headingStyle, lineSpacing }
        type: DataTypes.JSONB || DataTypes.JSON,
        allowNull: true,
      },
      buttonSettings: {
        // { shape, shadow, variants }
        type: DataTypes.JSONB || DataTypes.JSON,
        allowNull: true,
      },
      sidebarLayout: {
        // { variant: collapsible/compact/icon-only, position: fixed/floating }
        type: DataTypes.JSONB || DataTypes.JSON,
        allowNull: true,
      },
      logoConfig: {
        // { url, size, position, faviconUrl }
        type: DataTypes.JSONB || DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      tableName: 'theme_settings',
      schema: schemaName,
      timestamps: true,
    }
  );
};

module.exports = createThemeSettingsModel;

