const { DataTypes } = require('sequelize');

/**
 * GroupBooking schema factory for hotel-specific data
 * Stored in each hotel's separate schema.
 */
const createGroupBookingModel = (sequelize, schemaName) => {
  return sequelize.define(
    'GroupBooking',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      masterGroupId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      groupName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      companyName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      contactName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      contactPhone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      contactEmail: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      checkIn: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      checkOut: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      totalRoomsRequired: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      roomBlocks: {
        // [{ roomType, quantity, ratePerNight }]
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
      },
      guestList: {
        // [{ name, phone, email, roomType, roomNumber }]
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
      },
      baseAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      discountAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      finalAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      advancePaid: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      balanceAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      billingMode: {
        type: DataTypes.ENUM('consolidated', 'split'),
        allowNull: false,
        defaultValue: 'consolidated',
      },
      ratePlan: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      discountPercent: {
        type: DataTypes.DECIMAL(5, 4), // 0.1500 == 15%
        allowNull: true,
      },
      discountFlat: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'group_bookings',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['masterGroupId'], unique: true },
        { fields: ['status'] },
        { fields: ['checkIn', 'checkOut'] },
      ],
    }
  );
};

module.exports = createGroupBookingModel;

