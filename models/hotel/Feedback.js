const { DataTypes } = require('sequelize');

/**
 * Feedback schema factory for hotel-specific data
 * Stored in each hotel's separate schema
 */
const createFeedbackModel = (sequelize, schemaName) => {
  return sequelize.define(
    'Feedback',
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
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'feedback',
      schema: schemaName,
      timestamps: true,
      indexes: [
        { fields: ['rating'] },
        { fields: ['createdAt'] },
      ],
    }
  );
};

module.exports = createFeedbackModel;

