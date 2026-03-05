const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, Infinity],
    },
  },
  role: {
    type: DataTypes.ENUM('super_admin', 'hotel_admin','user'),
    allowNull: false,
  },
  roleId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  hotelId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  permissions: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'users',
  timestamps: true,
  indexes: [
    { fields: ['email'] },
    { fields: ['name'] },
    { fields: ['hotelId'] },
    { fields: ['role'] },
  ],
});

module.exports = User;
