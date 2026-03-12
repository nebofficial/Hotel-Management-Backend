const express = require('express');
const {
  createBackup,
  fetchBackupHistory,
  downloadBackup,
  restoreBackup,
  verifyBackup,
  scheduleBackup,
} = require('../controllers/backupController');

const router = express.Router();

router.post('/create', createBackup);
router.post('/schedule', scheduleBackup);
router.get('/history', fetchBackupHistory);
router.get('/download/:id', downloadBackup);
router.post('/restore/:id', restoreBackup);
router.post('/verify/:id', verifyBackup);

module.exports = router;

