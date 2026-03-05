const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  permissions: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: [],
  },
  hotelId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
}, {
  tableName: 'roles',
  timestamps: true,
  indexes: [
    { fields: ['hotelId'] },
    { 
      fields: ['name', 'hotelId'],
      unique: true,
    },
  ],
});

module.exports = Role;
