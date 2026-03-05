const User = require('./User');
const Hotel = require('./Hotel');
const Role = require('./Role');
const Plan = require('./Plan');
const HotelProfile = require('./HotelProfile');
const RoomTypeDefinition = require('./RoomTypeDefinition');
const HotelAmenity = require('./HotelAmenity');

// Define associations
User.belongsTo(Hotel, { foreignKey: 'hotelId', as: 'hotel' });
User.belongsTo(Role, { foreignKey: 'roleId', as: 'roleData' });

Hotel.belongsTo(Plan, { foreignKey: 'planId', as: 'plan' });
Hotel.hasMany(User, { foreignKey: 'hotelId', as: 'users' });
Hotel.hasMany(Role, { foreignKey: 'hotelId', as: 'roles' });
Hotel.hasOne(HotelProfile, { foreignKey: 'hotelId', as: 'profile' });
Hotel.hasMany(RoomTypeDefinition, { foreignKey: 'hotelId', as: 'roomTypeDefinitions' });
Hotel.hasMany(HotelAmenity, { foreignKey: 'hotelId', as: 'amenities' });

HotelProfile.belongsTo(Hotel, { foreignKey: 'hotelId', as: 'hotel' });
RoomTypeDefinition.belongsTo(Hotel, { foreignKey: 'hotelId', as: 'hotel' });
HotelAmenity.belongsTo(Hotel, { foreignKey: 'hotelId', as: 'hotel' });

Role.belongsTo(Hotel, { foreignKey: 'hotelId', as: 'hotel' });
Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });

Plan.hasMany(Hotel, { foreignKey: 'planId', as: 'hotels' });

module.exports = {
  User,
  Hotel,
  Role,
  Plan,
  HotelProfile,
  RoomTypeDefinition,
  HotelAmenity,
};

