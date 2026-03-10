/**
 * Shift conflict detection - checks if staff has overlapping assignments
 */

function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = String(timeStr).split(':').map((x) => parseInt(x, 10) || 0);
  return h * 60 + m;
}

/**
 * Check if two time ranges overlap (handles overnight shifts)
 */
function rangesOverlap(start1, end1, start2, end2) {
  const s1 = parseTimeToMinutes(start1);
  const e1 = parseTimeToMinutes(end1);
  const s2 = parseTimeToMinutes(start2);
  const e2 = parseTimeToMinutes(end2);
  // Overnight: if end < start, shift spans midnight
  const e1Adj = e1 < s1 ? e1 + 24 * 60 : e1;
  const e2Adj = e2 < s2 ? e2 + 24 * 60 : e2;
  return s1 < e2Adj && s2 < e1Adj;
}

/**
 * Detect conflicts for a staff member on a given date
 * @param {Object[]} assignments - [{ staffId, date, shift: { startTime, endTime } }]
 * @param {Object} newAssignment - { staffId, date, shift }
 * @returns {Object[]} conflicts
 */
function detectConflicts(assignments, newAssignment) {
  const conflicts = [];
  const { staffId, date, shift: newShift } = newAssignment;
  const newStart = newShift?.startTime;
  const newEnd = newShift?.endTime;
  if (!newStart || !newEnd) return conflicts;

  for (const a of assignments) {
    if (a.staffId !== staffId || a.date !== date) continue;
    const s = a.shift || {};
    if (rangesOverlap(newStart, newEnd, s.startTime, s.endTime)) {
      conflicts.push({
        assignmentId: a.id,
        shiftName: s.name,
        date: a.date,
      });
    }
  }
  return conflicts;
}

module.exports = {
  parseTimeToMinutes,
  rangesOverlap,
  detectConflicts,
};
