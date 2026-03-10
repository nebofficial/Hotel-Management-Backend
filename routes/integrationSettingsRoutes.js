const express = require('express');
const { testIntegrationConnection, summarizeStatuses } = require('../utils/integrationService');

module.exports = function createIntegrationSettingsRoutes(getHotelContext) {
  const router = express.Router({ mergeParams: true });

  // List all integrations for this hotel
  router.get('/', getHotelContext, async (req, res) => {
    try {
      const { Integration } = req.hotelModels;
      await Integration.sync();
      const items = await Integration.findAll({ order: [['type', 'ASC'], ['provider', 'ASC']] });
      const summary = summarizeStatuses(items);
      res.json({ items, summary });
    } catch (error) {
      console.error('integrationSettings.get error:', error);
      res.status(500).json({ message: 'Failed to load integrations', error: error.message });
    }
  });

  // Connect or create an integration
  router.post('/connect', getHotelContext, async (req, res) => {
    try {
      const { Integration } = req.hotelModels;
      await Integration.sync();
      const { type, provider, name, config, enabled = true } = req.body;

      if (!type || !provider) {
        return res.status(400).json({ message: 'type and provider are required' });
      }

      const [row] = await Integration.findOrCreate({
        where: { type, provider },
        defaults: {
          name: name || provider,
          enabled,
          status: enabled ? 'connected' : 'disconnected',
          config: config || {},
        },
      });

      if (!row.isNewRecord) {
        await row.update({
          name: name || row.name,
          enabled,
          status: enabled ? 'connected' : 'disconnected',
          config: config || row.config,
        });
      }

      res.json({ item: row });
    } catch (error) {
      console.error('integrationSettings.connect error:', error);
      res.status(500).json({ message: 'Failed to connect integration', error: error.message });
    }
  });

  // Update an integration (generic)
  router.put('/:id', getHotelContext, async (req, res) => {
    try {
      const { Integration } = req.hotelModels;
      await Integration.sync();
      const row = await Integration.findByPk(req.params.id);
      if (!row) {
        return res.status(404).json({ message: 'Integration not found' });
      }

      const { name, enabled, status, config } = req.body;
      await row.update({
        name: name ?? row.name,
        enabled: enabled ?? row.enabled,
        status: status ?? row.status,
        config: config ?? row.config,
      });

      res.json({ item: row });
    } catch (error) {
      console.error('integrationSettings.update error:', error);
      res.status(500).json({ message: 'Failed to update integration', error: error.message });
    }
  });

  // Disconnect an integration
  router.post('/:id/disconnect', getHotelContext, async (req, res) => {
    try {
      const { Integration } = req.hotelModels;
      await Integration.sync();
      const row = await Integration.findByPk(req.params.id);
      if (!row) {
        return res.status(404).json({ message: 'Integration not found' });
      }

      await row.update({
        enabled: false,
        status: 'disconnected',
      });

      res.json({ item: row });
    } catch (error) {
      console.error('integrationSettings.disconnect error:', error);
      res.status(500).json({ message: 'Failed to disconnect integration', error: error.message });
    }
  });

  // Test an integration connection
  router.post('/:id/test', getHotelContext, async (req, res) => {
    try {
      const { Integration } = req.hotelModels;
      await Integration.sync();
      const row = await Integration.findByPk(req.params.id);
      if (!row) {
        return res.status(404).json({ message: 'Integration not found' });
      }

      const result = await testIntegrationConnection(row);

      if (!result.success) {
        await row.update({
          status: 'error',
          lastError: result.message,
        });
      } else {
        await row.update({
          status: 'connected',
          lastError: null,
          lastSyncedAt: new Date(),
        });
      }

      res.json({ item: row, result });
    } catch (error) {
      console.error('integrationSettings.test error:', error);
      res.status(500).json({ message: 'Failed to test integration', error: error.message });
    }
  });

  return router;
};

