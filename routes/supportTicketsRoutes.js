const express = require('express');
const {
  createTicket,
  getTickets,
  getTicketById,
  updateTicketStatus,
  addTicketComment,
  uploadTicketAttachment,
  reopenOrCloseTicket,
} = require('../controllers/supportTicketsController');
const { uploadTicketAttachment: uploadMiddleware } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post('/', createTicket);
router.get('/', getTickets);
router.get('/:id', getTicketById);
router.patch('/:id/status', updateTicketStatus);
router.post('/:id/comments', addTicketComment);
router.post('/:id/attachments', uploadMiddleware, uploadTicketAttachment);
router.post('/:id/reopen-or-close', reopenOrCloseTicket);

module.exports = router;

