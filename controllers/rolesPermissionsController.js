const { User } = require('../models');
const PermissionAudit = require('../models/PermissionAudit');
const { getHotelRoles, createHotelRole, updateHotelRole } = require('../utils/accessControlService');
const { flattenMatrix, groupByModule } = require('../utils/permissionMatrixBuilder');

async function logAudit({ hotelId, roleId, admin, action, details }) {
  try {
    await PermissionAudit.sync({ alter: false });
    await PermissionAudit.create({
      hotelId,
      roleId: roleId || null,
      adminId: admin.id,
      adminName: admin.name || admin.email || 'Unknown',
      action,
      details: details || null,
    });
  } catch (e) {
    // Do not block main flow on audit failure
    console.error('PermissionAudit log error:', e.message);
  }
}

exports.fetchRoles = async (req, res) => {
  try {
    const hotelId = req.hotel.id;
    const roles = await getHotelRoles(hotelId);
    const shaped = roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      permissions: r.permissions || [],
      matrix: groupByModule(r.permissions || []),
      createdAt: r.createdAt,
    }));
    res.json({ roles: shaped });
  } catch (error) {
    console.error('fetchRoles error:', error);
    res.status(500).json({ message: 'Failed to load roles', error: error.message });
  }
};

exports.createRole = async (req, res) => {
  try {
    const hotelId = req.hotel.id;
    const { name, description, permissionsMatrix } = req.body || {};
    if (!name || !description) {
      return res.status(400).json({ message: 'Name and description are required' });
    }
    const permissions = permissionsMatrix ? flattenMatrix(permissionsMatrix) : [];
    const role = await createHotelRole({ hotelId, name, description, permissions });
    await logAudit({
      hotelId,
      roleId: role.id,
      admin: req.user,
      action: 'create_role',
      details: { name, description, permissions },
    });
    res.status(201).json({
      role: {
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions || [],
        matrix: groupByModule(role.permissions || []),
      },
    });
  } catch (error) {
    console.error('createRole error:', error);
    res.status(500).json({ message: 'Failed to create role', error: error.message });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const hotelId = req.hotel.id;
    const roleId = req.params.roleId;
    const { name, description, permissionsMatrix } = req.body || {};
    const permissions = permissionsMatrix ? flattenMatrix(permissionsMatrix) : undefined;
    const role = await updateHotelRole(roleId, { name, description, permissions });
    if (!role) return res.status(404).json({ message: 'Role not found' });
    await logAudit({
      hotelId,
      roleId: role.id,
      admin: req.user,
      action: 'update_role',
      details: { name, description, permissions },
    });
    res.json({
      role: {
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions || [],
        matrix: groupByModule(role.permissions || []),
      },
    });
  } catch (error) {
    console.error('updateRole error:', error);
    res.status(500).json({ message: 'Failed to update role', error: error.message });
  }
};

exports.assignPermissions = async (req, res) => {
  try {
    const hotelId = req.hotel.id;
    const roleId = req.params.roleId;
    const { permissionsMatrix } = req.body || {};
    const permissions = flattenMatrix(permissionsMatrix || []);
    const role = await updateHotelRole(roleId, { permissions });
    if (!role) return res.status(404).json({ message: 'Role not found' });
    await logAudit({
      hotelId,
      roleId: role.id,
      admin: req.user,
      action: 'assign_permissions',
      details: { permissions },
    });
    res.json({
      role: {
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions || [],
        matrix: groupByModule(role.permissions || []),
      },
    });
  } catch (error) {
    console.error('assignPermissions error:', error);
    res.status(500).json({ message: 'Failed to assign permissions', error: error.message });
  }
};

exports.assignRoleToStaff = async (req, res) => {
  try {
    const hotelId = req.hotel.id;
    const { staffId, roleId } = req.body || {};
    if (!staffId || !roleId) {
      return res.status(400).json({ message: 'staffId and roleId are required' });
    }
    const user = await User.findByPk(staffId);
    if (!user) return res.status(404).json({ message: 'Staff not found' });
    if (user.hotelId?.toString() !== hotelId.toString()) {
      return res.status(403).json({ message: 'Staff does not belong to this hotel' });
    }
    user.roleId = roleId;
    await user.save();
    await logAudit({
      hotelId,
      roleId,
      admin: req.user,
      action: 'assign_role_to_staff',
      details: { staffId },
    });
    res.json({ staff: { id: user.id, name: user.name, roleId: user.roleId } });
  } catch (error) {
    console.error('assignRoleToStaff error:', error);
    res.status(500).json({ message: 'Failed to assign role', error: error.message });
  }
};

exports.fetchPermissionLogs = async (req, res) => {
  try {
    const hotelId = req.hotel.id;
    await PermissionAudit.sync({ alter: false });
    const logs = await PermissionAudit.findAll({
      where: { hotelId },
      order: [['createdAt', 'DESC']],
      limit: 100,
    });
    res.json({ logs: logs.map((l) => l.toJSON()) });
  } catch (error) {
    console.error('fetchPermissionLogs error:', error);
    res.status(500).json({ message: 'Failed to load permission logs', error: error.message });
  }
};

exports.exportRolesReport = async (req, res) => {
  try {
    const hotelId = req.hotel.id;
    const roles = await getHotelRoles(hotelId);
    const payload = roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      permissions: r.permissions || [],
      matrix: groupByModule(r.permissions || []),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
    res.json({ roles: payload });
  } catch (error) {
    console.error('exportRolesReport error:', error);
    res.status(500).json({ message: 'Failed to export roles report', error: error.message });
  }
};

