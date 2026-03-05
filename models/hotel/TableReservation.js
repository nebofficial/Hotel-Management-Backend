const { DataTypes } = require('sequelize');

/**
 * TableReservation schema factory for hotel-specific data
 * Manages table reservations with guest info, time slots, etc.
 */
const createTableReservationModel = (sequelize, schemaName) => {
  return sequelize.define(
    'TableReservation',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      tableId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      tableNo: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      guestName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      guestPhone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      guestEmail: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      reservationDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      reservationTime: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      duration: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 120, // minutes
      },
      partySize: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 2,
      },
      status: {
        type: DataTypes.ENUM('Pending', 'Confirmed', 'Seated', 'Completed', 'Cancelled', 'No Show'),
        allowNull: false,
        defaultValue: 'Pending',
      },
      specialRequests: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      confirmedBy: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'table_reservations',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['tableId'] },
        { fields: ['reservationDate'] },
        { fields: ['status'] },
        { fields: ['guestPhone'] },
      ],
    },
  );
};

module.exports = createTableReservationModel;
