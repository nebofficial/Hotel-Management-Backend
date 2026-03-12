const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ticketsUploadDir = path.join(__dirname, '..', 'uploads', 'tickets');

if (!fs.existsSync(ticketsUploadDir)) {
  fs.mkdirSync(ticketsUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, ticketsUploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

module.exports = {
  uploadTicketAttachment: upload.single('attachment'),
};

