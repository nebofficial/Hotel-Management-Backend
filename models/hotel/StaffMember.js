const { DataTypes } = require('sequelize');

/**
 * StaffMember schema factory for hotel-specific data
 * Tracks housekeeping-related staff and their core roles
 */
const createStaffMemberModel = (sequelize, schemaName) => {
  return sequelize.define(
    'StaffMember',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('Housekeeping', 'Laundry', 'Inspector', 'Supervisor', 'Other'),
        allowNull: false,
        defaultValue: 'Housekeeping',
      },
      department: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      primaryArea: {
        // e.g. "Floors 1-3", "Public areas"
        type: DataTypes.STRING,
        allowNull: true,
      },
      roomNo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      floor: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      colorTag: {
        // Optional color hint for UI badges
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'staff_members',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['role'] },
        { fields: ['isActive'] },
        { fields: ['name'] },
      ],
    },
  );
};

module.exports = createStaffMemberModel;

