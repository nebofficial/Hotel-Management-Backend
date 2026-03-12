const { Op } = require('sequelize');
const SupportTicket = require('../models/SupportTicket');

async function ensureSync() {
  await SupportTicket.sync();
}

exports.createTicket = async (req, res) => {
  try {
    await ensureSync();
    const { title, category, description, priority } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const user = req.user || {};
    const baseHistory = [
      {
        id: 'created',
        type: 'status',
        message: 'Ticket created',
        createdAt: new Date().toISOString(),
      },
    ];

    const ticket = await SupportTicket.create({
      title,
      category: (category || 'technical').toLowerCase(),
      description,
      priority: (priority || 'medium').toLowerCase(),
      status: 'open',
      userId: user.id || null,
      userName: user.name || null,
      history: baseHistory,
    });

    res.status(201).json(ticket);
  } catch (error) {
    console.error('supportTickets.createTicket error:', error);
    res.status(500).json({ message: 'Failed to create ticket', error: error.message });
  }
};

exports.getTickets = async (req, res) => {
  try {
    await ensureSync();
    const where = {};
    const { status, priority } = req.query;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const tickets = await SupportTicket.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
    res.json({ items: tickets });
  } catch (error) {
    console.error('supportTickets.getTickets error:', error);
    res.status(500).json({ message: 'Failed to load tickets', error: error.message });
  }
};

exports.getTicketById = async (req, res) => {
  try {
    await ensureSync();
    const ticket = await SupportTicket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    res.json(ticket);
  } catch (error) {
    console.error('supportTickets.getTicketById error:', error);
    res.status(500).json({ message: 'Failed to load ticket', error: error.message });
  }
};

exports.updateTicketStatus = async (req, res) => {
  try {
    await ensureSync();
    const ticket = await SupportTicket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    const history = ticket.history || [];
    history.push({
      id: `status-${Date.now()}`,
      type: 'status',
      message: `Status changed to ${status}`,
      createdAt: new Date().toISOString(),
    });
    ticket.status = status;
    ticket.history = history;
    await ticket.save();
    res.json(ticket);
  } catch (error) {
    console.error('supportTickets.updateTicketStatus error:', error);
    res.status(500).json({ message: 'Failed to update ticket status', error: error.message });
  }
};

exports.addTicketComment = async (req, res) => {
  try {
    await ensureSync();
    const ticket = await SupportTicket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    const { message, internal } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Comment message is required' });
    }
    const user = req.user || {};
    const comments = ticket.comments || [];
    const now = new Date().toISOString();
    const comment = {
      id: `c-${Date.now()}`,
      author: user.name || 'User',
      message,
      internal: !!internal,
      createdAt: now,
    };
    comments.push(comment);

    const history = ticket.history || [];
    history.push({
      id: `comment-${Date.now()}`,
      type: 'comment',
      message: 'Comment added',
      createdAt: now,
    });

    ticket.comments = comments;
    ticket.history = history;
    await ticket.save();

    res.json(ticket);
  } catch (error) {
    console.error('supportTickets.addTicketComment error:', error);
    res.status(500).json({ message: 'Failed to add comment', error: error.message });
  }
};

exports.uploadTicketAttachment = async (req, res) => {
  try {
    await ensureSync();
    const ticket = await SupportTicket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No attachment uploaded' });
    }
    const attachments = ticket.attachments || [];
    const now = new Date().toISOString();
    const publicPath = `/uploads/tickets/${req.file.filename}`;

    attachments.push({
      id: `a-${Date.now()}`,
      fileName: req.file.originalname,
      url: publicPath,
      mimeType: req.file.mimetype,
      size: req.file.size,
      createdAt: now,
    });

    const history = ticket.history || [];
    history.push({
      id: `attach-${Date.now()}`,
      type: 'attachment',
      message: 'Attachment uploaded',
      createdAt: now,
    });

    ticket.attachments = attachments;
    ticket.history = history;
    await ticket.save();

    res.json(ticket);
  } catch (error) {
    console.error('supportTickets.uploadTicketAttachment error:', error);
    res.status(500).json({ message: 'Failed to upload attachment', error: error.message });
  }
};

exports.reopenOrCloseTicket = async (req, res) => {
  try {
    await ensureSync();
    const ticket = await SupportTicket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    const { action } = req.body;
    if (!action || !['close', 'reopen'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const history = ticket.history || [];
    const now = new Date().toISOString();

    if (action === 'close') {
      ticket.status = 'closed';
      history.push({
        id: `close-${Date.now()}`,
        type: 'status',
        message: 'Ticket closed',
        createdAt: now,
      });
    } else {
      ticket.status = 'open';
      history.push({
        id: `reopen-${Date.now()}`,
        type: 'status',
        message: 'Ticket reopened',
        createdAt: now,
      });
    }

    ticket.history = history;
    await ticket.save();
    res.json(ticket);
  } catch (error) {
    console.error('supportTickets.reopenOrCloseTicket error:', error);
    res.status(500).json({ message: 'Failed to update ticket', error: error.message });
  }
};

