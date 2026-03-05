/**
 * Room upgrade engine.
 * Given a reserved room and available rooms, pick a higher-category upgrade if possible.
 * Very simple heuristic based on pricePerNight.
 */
async function suggestUpgrade({ Room, currentRoomId }) {
  const current = await Room.findByPk(currentRoomId);
  if (!current) return null;

  const all = await Room.findAll({
    order: [['pricePerNight', 'ASC']],
  });

  const currentPrice = Number(current.pricePerNight || 0);
  const candidates = all.filter((r) => Number(r.pricePerNight || 0) > currentPrice);
  if (!candidates.length) return null;

  return candidates[0];
}

module.exports = {
  suggestUpgrade,
};

