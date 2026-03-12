const { listNotifications, markRead } = require('../utils/notificationService');
const {
  generateLowAvailabilityAlerts,
  generatePaymentAlerts,
  generateMaintenanceAlerts,
} = require('../utils/alertGenerator');

exports.getNotifications = async (req, res) => {
  try {
    const hotelId = req.hotel?.id?.toString() || req.query.hotelId || null;
    const items = await listNotifications({ hotelId, hotelModels: req.hotelModels });
    res.json({ items });
  } catch (error) {
    console.error('notifications.getNotifications error:', error);
    res
      .status(error.status || 500)
      .json({ message: 'Failed to load notifications', error: error.message });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const row = await markRead(id);
    res.json({ item: row });
  } catch (error) {
    console.error('notifications.markNotificationRead error:', error);
    res
      .status(error.status || 500)
      .json({ message: 'Failed to mark notification as read', error: error.message });
  }
};

exports.getLowAvailabilityAlerts = async (req, res) => {
  try {
    const { Room, Booking } = req.hotelModels;
    const items = await generateLowAvailabilityAlerts({ Room, Booking });
    res.json({ items });
  } catch (error) {
    console.error('notifications.getLowAvailabilityAlerts error:', error);
    res
      .status(error.status || 500)
      .json({ message: 'Failed to load low availability alerts', error: error.message });
  }
};

exports.getPaymentAlerts = async (req, res) => {
  try {
    const { RoomBill } = req.hotelModels;
    const items = await generatePaymentAlerts({ RoomBill });
    res.json({ items });
  } catch (error) {
    console.error('notifications.getPaymentAlerts error:', error);
    res
      .status(error.status || 500)
      .json({ message: 'Failed to load payment alerts', error: error.message });
  }
};

exports.getMaintenanceAlerts = async (req, res) => {
  try {
    const { MaintenanceRequest, Room } = req.hotelModels;
    const items = await generateMaintenanceAlerts({ MaintenanceRequest, Room });
    res.json({ items });
  } catch (error) {
    console.error('notifications.getMaintenanceAlerts error:', error);
    res
      .status(error.status || 500)
      .json({ message: 'Failed to load maintenance alerts', error: error.message });
  }
};

