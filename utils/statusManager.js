const VALID_STATUSES = ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'];

function normalizeStatus(status) {
  const s = String(status || '').toLowerCase();
  if (!s) return null;
  if (s === 'no-show' || s === 'no_show') return 'cancelled';
  return VALID_STATUSES.includes(s) ? s : null;
}

function canTransition(current, next) {
  const c = normalizeStatus(current);
  const n = normalizeStatus(next);
  if (!c || !n) return false;
  if (c === n) return true;
  if (c === 'pending' && (n === 'confirmed' || n === 'cancelled')) return true;
  if (c === 'confirmed' && (n === 'checked_in' || n === 'cancelled')) return true;
  if (c === 'checked_in' && (n === 'checked_out' || n === 'cancelled')) return true;
  return false;
}

function isActiveStatus(status) {
  const s = normalizeStatus(status);
  return s === 'pending' || s === 'confirmed' || s === 'checked_in';
}

module.exports = {
  VALID_STATUSES,
  normalizeStatus,
  canTransition,
  isActiveStatus,
};

