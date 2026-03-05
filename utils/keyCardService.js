const crypto = require('crypto');

function generateKeyCardNumber(roomNumber) {
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `CARD-${roomNumber}-${suffix}`;
}

function createKeyCardPayload({ roomNumber, checkOut }) {
  const now = new Date();
  const expiry = checkOut ? new Date(checkOut) : new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return {
    keyCardNumber: generateKeyCardNumber(roomNumber),
    activatedAt: now,
    validUntil: expiry,
  };
}

module.exports = {
  createKeyCardPayload,
};

