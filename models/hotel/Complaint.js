const { DataTypes } = require('sequelize');

/**
 * Complaint schema factory for hotel-specific data
 * Stored in each hotel's separate schema
 */
const createComplaintModel = (sequelize, schemaName) => {
  return sequelize.define(
    'Complaint',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      guestName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('Open', 'In Progress', 'Resolved'),
        allowNull: false,
        defaultValue: 'Open',
      },
      assignedTo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      resolutionNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'complaints',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['status'] },
        { fields: ['createdAt'] },
      ],
    }
  );
};

module.exports = createComplaintModel;

