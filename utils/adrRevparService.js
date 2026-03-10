/**
 * ADR (Average Daily Rate) and RevPAR (Revenue Per Available Room) calculations
 * ADR = Room Revenue / Room Nights Sold
 * RevPAR = Room Revenue / (Total Rooms * Days in Period)
 */
function calculateADR(roomRevenue, roomNightsSold) {
  if (!roomNightsSold || roomNightsSold <= 0) return 0;
  return (roomRevenue || 0) / roomNightsSold;
}

function calculateRevPAR(roomRevenue, totalRooms, daysInPeriod) {
  if (!totalRooms || !daysInPeriod || totalRooms * daysInPeriod <= 0) return 0;
  return (roomRevenue || 0) / (totalRooms * daysInPeriod);
}

module.exports = {
  calculateADR,
  calculateRevPAR,
};
