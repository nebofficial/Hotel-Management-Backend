const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BackupJob = sequelize.define(
  'BackupJob',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    type: {
      // Full / Database / Files
      type: DataTypes.STRING(24),
      allowNull: false,
      defaultValue: 'Full',
    },
    scope: {
      type: DataTypes.STRING(24),
      allowNull: false,
      defaultValue: 'Full',
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Running', 'Completed', 'Failed'),
      allowNull: false,
      defaultValue: 'Completed',
    },
    sizeBytes: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    storageLocation: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    filePath: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    verificationStatus: {
      type: DataTypes.ENUM('Not Verified', 'Valid', 'Corrupt'),
      allowNull: false,
      defaultValue: 'Not Verified',
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    finishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'backup_jobs',
    timestamps: true,
    indexes: [{ fields: ['status'] }, { fields: ['createdAt'] }],
  },
);

module.exports = BackupJob;

