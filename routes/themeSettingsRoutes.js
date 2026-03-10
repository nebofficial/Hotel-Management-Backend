const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { defaultThemeSettings } = require('../utils/themeService');

module.exports = function createThemeSettingsRoutes(getHotelContext) {
  const router = express.Router({ mergeParams: true });

  const uploadDir = path.join(__dirname, '..', 'uploads', 'themes');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const base = path.basename(file.originalname, ext);
      cb(null, `${base}-${Date.now()}${ext}`);
    },
  });

  const upload = multer({ storage });

  // Fetch theme settings (create defaults if missing)
  router.get('/', getHotelContext, async (req, res) => {
    try {
      const { ThemeSettings } = req.hotelModels;
      await ThemeSettings.sync();
      let row = await ThemeSettings.findOne();
      if (!row) {
        row = await ThemeSettings.create(defaultThemeSettings());
      }
      res.json({ settings: row.toJSON() });
    } catch (error) {
      console.error('themeSettings.get error:', error);
      res.status(500).json({ message: 'Failed to load theme settings', error: error.message });
    }
  });

  // Update theme settings
  router.put('/', getHotelContext, async (req, res) => {
    try {
      const { ThemeSettings } = req.hotelModels;
      await ThemeSettings.sync();
      let row = await ThemeSettings.findOne();
      if (!row) {
        row = await ThemeSettings.create(defaultThemeSettings());
      }
      const allowed = [
        'themeName',
        'mode',
        'brandColors',
        'fontSettings',
        'buttonSettings',
        'sidebarLayout',
        'logoConfig',
      ];
      const patch = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) patch[key] = req.body[key];
      }
      await row.update(patch);
      res.json({ settings: row.toJSON() });
    } catch (error) {
      console.error('themeSettings.update error:', error);
      res.status(500).json({ message: 'Failed to update theme settings', error: error.message });
    }
  });

  // Reset to defaults
  router.post('/reset', getHotelContext, async (req, res) => {
    try {
      const { ThemeSettings } = req.hotelModels;
      await ThemeSettings.sync();
      let row = await ThemeSettings.findOne();
      const defaults = defaultThemeSettings();
      if (!row) {
        row = await ThemeSettings.create(defaults);
      } else {
        await row.update(defaults);
      }
      res.json({ settings: row.toJSON() });
    } catch (error) {
      console.error('themeSettings.reset error:', error);
      res.status(500).json({ message: 'Failed to reset theme settings', error: error.message });
    }
  });

  // Logo upload
  router.post('/logo', getHotelContext, upload.single('logo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No logo file uploaded' });
      }
      const { ThemeSettings } = req.hotelModels;
      await ThemeSettings.sync();
      let row = await ThemeSettings.findOne();
      if (!row) {
        row = await ThemeSettings.create(defaultThemeSettings());
      }

      const publicPath = `/uploads/themes/${req.file.filename}`;
      const current = row.logoConfig || {};
      await row.update({
        logoConfig: {
          ...current,
          url: publicPath,
        },
      });

      res.json({ settings: row.toJSON(), logoUrl: publicPath });
    } catch (error) {
      console.error('themeSettings.logo error:', error);
      res.status(500).json({ message: 'Failed to upload logo', error: error.message });
    }
  });

  return router;
};

