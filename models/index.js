const User = require('./User');
const Hotel = require('./Hotel');
const Role = require('./Role');
const Plan = require('./Plan');
const HotelProfile = require('./HotelProfile');
const CheckinCheckoutRules = require('./CheckinCheckoutRules');
const CurrencyLanguageSettings = require('./CurrencyLanguageSettings');
const RoomTypeDefinition = require('./RoomTypeDefinition');
const HotelAmenity = require('./HotelAmenity');
const HelpSystemSnapshot = require('./HelpSystemSnapshot');
const ActivityLog = require('./ActivityLog');

// Define associations
User.belongsTo(Hotel, { foreignKey: 'hotelId', as: 'hotel' });
User.belongsTo(Role, { foreignKey: 'roleId', as: 'roleData' });

Hotel.belongsTo(Plan, { foreignKey: 'planId', as: 'plan' });
Hotel.hasMany(User, { foreignKey: 'hotelId', as: 'users' });
Hotel.hasMany(Role, { foreignKey: 'hotelId', as: 'roles' });
Hotel.hasOne(HotelProfile, { foreignKey: 'hotelId', as: 'profile' });
Hotel.hasOne(CheckinCheckoutRules, { foreignKey: 'hotelId', as: 'checkinCheckoutRules' });
Hotel.hasOne(CurrencyLanguageSettings, { foreignKey: 'hotelId', as: 'currencyLanguageSettings' });
Hotel.hasMany(RoomTypeDefinition, { foreignKey: 'hotelId', as: 'roomTypeDefinitions' });
Hotel.hasMany(HotelAmenity, { foreignKey: 'hotelId', as: 'amenities' });

HotelProfile.belongsTo(Hotel, { foreignKey: 'hotelId', as: 'hotel' });
CheckinCheckoutRules.belongsTo(Hotel, { foreignKey: 'hotelId', as: 'hotel' });
CurrencyLanguageSettings.belongsTo(Hotel, { foreignKey: 'hotelId', as: 'hotel' });
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
  CheckinCheckoutRules,
  CurrencyLanguageSettings,
  RoomTypeDefinition,
  HotelAmenity,
  HelpSystemSnapshot,
  ActivityLog,
};

