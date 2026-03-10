const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Optional helper model to record periodic snapshots of
 * help & system metrics (not strictly required by the UI,
 * but available for future reporting).
 */

const HelpSystemSnapshot = sequelize.define(
  'HelpSystemSnapshot',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    label: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    snapshotAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    payload: {
      type: DataTypes.JSONB || DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    tableName: 'help_system_snapshots',
    timestamps: false,
  }
);

module.exports = HelpSystemSnapshot;

