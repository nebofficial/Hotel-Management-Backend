const { DataTypes } = require('sequelize');

/**
 * LaundryTask schema factory for hotel-specific data
 * Tracks laundry loads, cycles, and processing status
 */
const createLaundryTaskModel = (sequelize, schemaName) => {
  return sequelize.define(
    'LaundryTask',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      loadNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      itemType: {
        // e.g. 'Bed Sheets', 'Towels', 'Pillow Cases', 'Blankets'
        type: DataTypes.STRING,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      scheduledDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      assignedTo: {
        // Staff member or vendor name
        type: DataTypes.STRING,
        allowNull: true,
      },
      assignedType: {
        // 'Staff' or 'Vendor'
        type: DataTypes.ENUM('Staff', 'Vendor'),
        allowNull: false,
        defaultValue: 'Staff',
      },
      status: {
        type: DataTypes.ENUM('Pending', 'Washing', 'Drying', 'Ironing', 'Folding', 'Completed'),
        allowNull: false,
        defaultValue: 'Pending',
      },
      cycleType: {
        // e.g. 'Daily', 'Weekly', 'On-Demand'
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'Daily',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'laundry_tasks',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['loadNumber'] },
        { fields: ['scheduledDate'] },
        { fields: ['status'] },
        { fields: ['itemType'] },
      ],
    },
  );
};

module.exports = createLaundryTaskModel;
