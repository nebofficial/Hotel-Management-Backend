/**
 * Occupancy calculation utilities for reports
 */

function getOccupancyRate(occupiedCount, totalRooms) {
  if (!totalRooms || totalRooms <= 0) return 0;
  return Math.min(100, Math.round((occupiedCount / totalRooms) * 1000) / 10);
}

function getWeekBounds(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(d);
  weekStart.setDate(diff);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return {
    weekStart: weekStart.toISOString().slice(0, 10),
    weekEnd: weekEnd.toISOString().slice(0, 10),
  };
}

module.exports = {
  getOccupancyRate,
  getWeekBounds,
};
