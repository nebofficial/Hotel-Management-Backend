const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { configureGateway, testGatewayConnection } = require('../utils/paymentGatewayService');

module.exports = function createPaymentMethodsRoutes(getHotelContext) {
  const router = express.Router({ mergeParams: true });

  // List all payment methods
  router.get('/', getHotelContext, async (req, res) => {
    try {
      const { PaymentMethod } = req.hotelModels;
      await PaymentMethod.sync();
      const methods = await PaymentMethod.findAll({
        order: [
          ['sortOrder', 'ASC'],
          ['createdAt', 'ASC'],
        ],
      });
      res.json({ methods });
    } catch (error) {
      console.error('Get payment methods error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

  const methodValidators = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('type').isString().isIn(['CASH', 'CARD', 'ONLINE', 'BANK']).withMessage('Invalid type'),
    body('active').optional().isBoolean(),
    body('sortOrder').optional().isInt({ min: 1 }),
  ];

  // Create payment method
  router.post('/', getHotelContext, methodValidators, async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { PaymentMethod } = req.hotelModels;
      await PaymentMethod.sync();

      const payload = {
        name: req.body.name,
        type: req.body.type,
        config: req.body.config || null,
        active: req.body.active !== undefined ? !!req.body.active : true,
        sortOrder: req.body.sortOrder || 1,
        confirmationMode: req.body.confirmationMode || null,
        lastUpdatedAt: new Date(),
      };

      const method = await PaymentMethod.create(payload);
      res.status(201).json({ method });
    } catch (error) {
      console.error('Create payment method error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

  // Update payment method
  router.put('/:id', getHotelContext, methodValidators, async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { PaymentMethod } = req.hotelModels;
      await PaymentMethod.sync();
      const method = await PaymentMethod.findByPk(req.params.id);
      if (!method) return res.status(404).json({ message: 'Payment method not found' });

      await method.update({
        name: req.body.name,
        type: req.body.type,
        config: req.body.config ?? method.config,
        active: req.body.active !== undefined ? !!req.body.active : method.active,
        sortOrder: req.body.sortOrder || method.sortOrder,
        confirmationMode: req.body.confirmationMode ?? method.confirmationMode,
        lastUpdatedAt: new Date(),
      });
      res.json({ method });
    } catch (error) {
      console.error('Update payment method error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

  // Toggle status
  router.patch(
    '/:id/status',
    getHotelContext,
    [body('active').isBoolean().withMessage('active must be boolean')],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        const { PaymentMethod } = req.hotelModels;
        await PaymentMethod.sync();
        const method = await PaymentMethod.findByPk(req.params.id);
        if (!method) return res.status(404).json({ message: 'Payment method not found' });
        method.active = !!req.body.active;
        method.lastUpdatedAt = new Date();
        await method.save();
        res.json({ method });
      } catch (error) {
        console.error('Toggle payment method status error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
      }
    }
  );

  // Configure gateway (ONLINE methods)
  router.post('/:id/gateway', getHotelContext, async (req, res) => {
    try {
      const { PaymentMethod } = req.hotelModels;
      await PaymentMethod.sync();
      const method = await PaymentMethod.findByPk(req.params.id);
      if (!method) return res.status(404).json({ message: 'Payment method not found' });
      if (method.type !== 'ONLINE') {
        return res.status(400).json({ message: 'Gateway configuration is only valid for ONLINE methods' });
      }

      const gatewayConfig = req.body || {};
      const result = await configureGateway(method.name, gatewayConfig);

      method.config = {
        ...(method.config || {}),
        gateway: gatewayConfig,
      };
      method.lastUpdatedAt = new Date();
      await method.save();

      res.json({ method, testResult: result });
    } catch (error) {
      console.error('Configure payment gateway error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

  // Confirmation settings (stored on each method for now)
  router.patch('/confirmation-settings', getHotelContext, async (req, res) => {
    try {
      const { PaymentMethod } = req.hotelModels;
      await PaymentMethod.sync();
      const { confirmationMode } = req.body; // "AUTO" or "MANUAL"
      const methods = await PaymentMethod.findAll();
      await Promise.all(
        methods.map((m) =>
          m.update({
            confirmationMode: confirmationMode || m.confirmationMode,
            lastUpdatedAt: new Date(),
          })
        )
      );
      res.json({ methods });
    } catch (error) {
      console.error('Update payment confirmation settings error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

  // Transactions log
  router.get('/transactions', getHotelContext, async (req, res) => {
    try {
      const { PaymentTransaction } = req.hotelModels;
      await PaymentTransaction.sync();

      const where = {};
      if (req.query.status) {
        where.status = req.query.status;
      }
      if (req.query.methodId) {
        where.methodId = req.query.methodId;
      }
      if (req.query.startDate || req.query.endDate) {
        where.createdAt = where.createdAt || {};
        if (req.query.startDate) {
          where.createdAt[Op.gte] = new Date(req.query.startDate);
        }
        if (req.query.endDate) {
          where.createdAt[Op.lte] = new Date(req.query.endDate + 'T23:59:59');
        }
      }

      const page = parseInt(req.query.page || '1', 10);
      const pageSize = Math.min(parseInt(req.query.pageSize || '20', 10), 100);
      const offset = (page - 1) * pageSize;

      const { rows, count } = await PaymentTransaction.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: pageSize,
        offset,
      });

      res.json({
        transactions: rows,
        pagination: {
          page,
          pageSize,
          total: count,
        },
      });
    } catch (error) {
      console.error('Get payment transactions error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

  return router;
};

