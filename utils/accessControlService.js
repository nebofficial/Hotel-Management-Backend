const { Role } = require('../models');

async function getHotelRoles(hotelId) {
  return Role.findAll({
    where: { hotelId },
    order: [['createdAt', 'ASC']],
  });
}

async function createHotelRole({ hotelId, name, description, permissions }) {
  return Role.create({
    hotelId,
    name,
    description,
    permissions: permissions || [],
  });
}

async function updateHotelRole(roleId, payload) {
  const role = await Role.findByPk(roleId);
  if (!role) return null;
  if (payload.name !== undefined) role.name = payload.name;
  if (payload.description !== undefined) role.description = payload.description;
  if (payload.permissions !== undefined) role.permissions = payload.permissions;
  await role.save();
  return role;
}

module.exports = {
  getHotelRoles,
  createHotelRole,
  updateHotelRole,
};

