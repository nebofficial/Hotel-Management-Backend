const path = require('path');
const fs = require('fs');
const BackupJob = require('../models/BackupJob');

const backupsDir = path.join(__dirname, '..', 'uploads', 'backups');

if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

async function createBackupJob(scope = 'Full') {
  await BackupJob.sync();
  const now = new Date();
  const fileName = `backup-${scope.toLowerCase()}-${now.getTime()}.zip`;
  const filePath = path.join(backupsDir, fileName);

  // We don't actually create real backup files here; just touch a placeholder.
  fs.writeFileSync(filePath, 'Backup placeholder data', { encoding: 'utf8' });

  const sizeBytes = fs.statSync(filePath).size;

  const job = await BackupJob.create({
    type: scope,
    scope,
    status: 'Completed',
    sizeBytes,
    storageLocation: 'Local',
    filePath: `/uploads/backups/${fileName}`,
    startedAt: now,
    finishedAt: new Date(),
  });

  return job;
}

async function listBackups() {
  await BackupJob.sync();
  return BackupJob.findAll({ order: [['createdAt', 'DESC']] });
}

async function verifyBackup(id) {
  await BackupJob.sync();
  const job = await BackupJob.findByPk(id);
  if (!job) throw new Error('Backup not found');

  // Simple integrity check: confirm file exists and has some size
  const absPath = path.join(__dirname, '..', job.filePath.replace('/uploads/', 'uploads/'));
  if (fs.existsSync(absPath) && fs.statSync(absPath).size > 0) {
    job.verificationStatus = 'Valid';
  } else {
    job.verificationStatus = 'Corrupt';
  }
  await job.save();
  return job;
}

module.exports = {
  createBackupJob,
  listBackups,
  verifyBackup,
};

