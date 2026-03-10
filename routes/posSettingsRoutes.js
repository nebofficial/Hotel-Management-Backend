const express = require('express');
const { defaultPOSSettings } = require('../utils/posSettingsService');

module.exports = function createPOSSettingsRoutes(getHotelContext) {
  const router = express.Router({ mergeParams: true });

  // Fetch POS settings (create defaults if none)
  router.get('/', getHotelContext, async (req, res) => {
    try {
      const { POSSettings } = req.hotelModels;
      await POSSettings.sync();
      let row = await POSSettings.findOne();
      if (!row) {
        const defaults = defaultPOSSettings();
        row = await POSSettings.create(defaults);
      }
      res.json({ settings: row.toJSON() });
    } catch (error) {
      console.error('Get POS settings error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

  // Update POS settings
  router.put('/', getHotelContext, async (req, res) => {
    try {
      const { POSSettings } = req.hotelModels;
      await POSSettings.sync();
      let row = await POSSettings.findOne();
      if (!row) {
        row = await POSSettings.create(defaultPOSSettings());
      }
      const updates = {};
      [
        'defaultTerminalName',
        'terminalLocation',
        'autoLoginEnabled',
        'printerConfig',
        'tableLayout',
        'menuCategories',
        'orderNotifications',
        'taxSettings',
        'receiptFormat',
      ].forEach((key) => {
        if (req.body[key] !== undefined) {
          updates[key] = req.body[key];
        }
      });
      await row.update(updates);
      res.json({ settings: row.toJSON() });
    } catch (error) {
      console.error('Update POS settings error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

  return router;
};

