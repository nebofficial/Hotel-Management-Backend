const BackupJob = require('../models/BackupJob');
const { createBackupJob, listBackups, verifyBackup } = require('../utils/backupService');
const { restoreFromBackup } = require('../utils/restoreService');

exports.createBackup = async (req, res) => {
  try {
    const { scope } = req.body;
    const job = await createBackupJob(scope || 'Full');
    res.status(201).json(job);
  } catch (error) {
    console.error('backup.createBackup error:', error);
    res.status(500).json({ message: 'Failed to create backup', error: error.message });
  }
};

exports.fetchBackupHistory = async (req, res) => {
  try {
    const jobs = await listBackups();
    res.json({ items: jobs });
  } catch (error) {
    console.error('backup.fetchBackupHistory error:', error);
    res.status(500).json({ message: 'Failed to load backup history', error: error.message });
  }
};

exports.downloadBackup = async (req, res) => {
  try {
    await BackupJob.sync();
    const job = await BackupJob.findByPk(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Backup not found' });
    }
    res.json({ filePath: job.filePath, sizeBytes: job.sizeBytes });
  } catch (error) {
    console.error('backup.downloadBackup error:', error);
    res.status(500).json({ message: 'Failed to get backup download info', error: error.message });
  }
};

exports.restoreBackup = async (req, res) => {
  try {
    const result = await restoreFromBackup(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('backup.restoreBackup error:', error);
    res.status(500).json({ message: 'Failed to restore from backup', error: error.message });
  }
};

exports.verifyBackup = async (req, res) => {
  try {
    const job = await verifyBackup(req.params.id);
    res.json(job);
  } catch (error) {
    console.error('backup.verifyBackup error:', error);
    res.status(500).json({ message: 'Failed to verify backup', error: error.message });
  }
};

exports.scheduleBackup = async (req, res) => {
  try {
    // For now just echo back schedule config; real scheduler can be added later.
    const { frequency, timeOfDay, retentionDays } = req.body;
    res.json({
      frequency: frequency || 'Daily',
      timeOfDay: timeOfDay || '02:00',
      retentionDays: retentionDays || 30,
      message: 'Schedule accepted (stub) – implement real scheduler later.',
    });
  } catch (error) {
    console.error('backup.scheduleBackup error:', error);
    res.status(500).json({ message: 'Failed to schedule backup', error: error.message });
  }
};

