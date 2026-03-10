const express = require('express');
const { body, validationResult } = require('express-validator');
const { buildInvoicePreview } = require('../utils/invoiceTemplateService');

module.exports = function createInvoiceTemplatesRoutes(getHotelContext) {
  const router = express.Router({ mergeParams: true });

  // List templates
  router.get('/', getHotelContext, async (req, res) => {
    try {
      const { InvoiceTemplate } = req.hotelModels;
      await InvoiceTemplate.sync();
      const templates = await InvoiceTemplate.findAll({
        order: [
          ['isDefault', 'DESC'],
          ['updatedAt', 'DESC'],
        ],
      });
      res.json({ templates });
    } catch (error) {
      console.error('Get invoice templates error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

  const templateValidators = [
    body('name').trim().notEmpty().withMessage('Template name is required'),
    body('layoutStyle').optional().isString(),
    body('isDefault').optional().isBoolean(),
    body('active').optional().isBoolean(),
  ];

  // Create template
  router.post('/', getHotelContext, templateValidators, async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { InvoiceTemplate } = req.hotelModels;
      await InvoiceTemplate.sync();

      const payload = {
        name: req.body.name,
        layoutStyle: req.body.layoutStyle || 'CLASSIC',
        isDefault: !!req.body.isDefault,
        active: req.body.active !== undefined ? !!req.body.active : true,
        branding: req.body.branding || null,
        fieldsConfig: req.body.fieldsConfig || null,
        taxDisplayMode: req.body.taxDisplayMode || 'DETAILED',
        footerNotes: req.body.footerNotes || null,
        lastEditedAt: new Date(),
      };

      if (payload.isDefault) {
        await InvoiceTemplate.update({ isDefault: false }, { where: {} });
      }

      const tmpl = await InvoiceTemplate.create(payload);
      res.status(201).json({ template: tmpl });
    } catch (error) {
      console.error('Create invoice template error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

  // Update template
  router.put('/:id', getHotelContext, templateValidators, async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { InvoiceTemplate } = req.hotelModels;
      await InvoiceTemplate.sync();
      const tmpl = await InvoiceTemplate.findByPk(req.params.id);
      if (!tmpl) return res.status(404).json({ message: 'Invoice template not found' });

      const updates = {
        name: req.body.name,
        layoutStyle: req.body.layoutStyle || tmpl.layoutStyle,
        branding: req.body.branding ?? tmpl.branding,
        fieldsConfig: req.body.fieldsConfig ?? tmpl.fieldsConfig,
        taxDisplayMode: req.body.taxDisplayMode || tmpl.taxDisplayMode,
        footerNotes: req.body.footerNotes ?? tmpl.footerNotes,
        active: req.body.active !== undefined ? !!req.body.active : tmpl.active,
        lastEditedAt: new Date(),
      };

      if (req.body.isDefault !== undefined) {
        if (req.body.isDefault) {
          await InvoiceTemplate.update({ isDefault: false }, { where: {} });
        }
        updates.isDefault = !!req.body.isDefault;
      }

      await tmpl.update(updates);
      res.json({ template: tmpl });
    } catch (error) {
      console.error('Update invoice template error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

  // Delete template
  router.delete('/:id', getHotelContext, async (req, res) => {
    try {
      const { InvoiceTemplate } = req.hotelModels;
      await InvoiceTemplate.sync();
      const tmpl = await InvoiceTemplate.findByPk(req.params.id);
      if (!tmpl) return res.status(404).json({ message: 'Invoice template not found' });
      await tmpl.destroy();
      res.status(204).send();
    } catch (error) {
      console.error('Delete invoice template error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

  // Preview
  router.post('/:id/preview', getHotelContext, async (req, res) => {
    try {
      const { InvoiceTemplate } = req.hotelModels;
      await InvoiceTemplate.sync();
      const tmpl = await InvoiceTemplate.findByPk(req.params.id);
      if (!tmpl) return res.status(404).json({ message: 'Invoice template not found' });

      const preview = await buildInvoicePreview(tmpl.toJSON(), req.body || {});
      res.json({ preview });
    } catch (error) {
      console.error('Preview invoice template error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

  return router;
};

