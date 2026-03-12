const express = require('express');
const {
  checkForUpdates,
  installUpdate,
  fetchUpdateHistory,
  applySecurityPatch,
  restartSystem,
} = require('../controllers/systemUpdateController');

const router = express.Router();

router.get('/check', checkForUpdates);
router.post('/install', installUpdate);
router.get('/history', fetchUpdateHistory);
router.post('/patch', applySecurityPatch);
router.post('/restart', restartSystem);

module.exports = router;

