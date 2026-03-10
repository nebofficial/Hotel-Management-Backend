function toNumber(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function aggregateBy(bookings, key, picker) {
  const map = {};
  bookings.forEach((b) => {
    const k = (b[key] || 'Unknown').toString();
    if (!map[k]) {
      map[k] = { key: k, bookings: 0, revenue: 0 };
    }
    map[k].bookings += 1;
    map[k].revenue += toNumber(picker ? picker(b) : b.totalAmount);
  });
  return Object.values(map);
}

function detectOtaChannel(booking) {
  const extras = booking.extras || {};
  const raw =
    (extras.otaChannel ||
      extras.channel ||
      extras.source ||
      booking.paymentMode ||
      '').toString().toLowerCase();

  if (!raw) return 'Direct';
  if (raw.includes('booking')) return 'Booking.com';
  if (raw.includes('expedia')) return 'Expedia';
  if (raw.includes('agoda')) return 'Agoda';
  if (raw.includes('airbnb')) return 'Airbnb';
  if (raw.includes('makemytrip') || raw.includes('mmt')) return 'MakeMyTrip';
  if (raw.includes('goibibo')) return 'Goibibo';
  if (raw.includes('direct')) return 'Direct';
  if (raw.includes('website')) return 'Website';
  return 'Other';
}

function buildMarketingOverview(bookings) {
  const totalBookings = bookings.length;
  const totalRevenue = bookings.reduce((sum, b) => sum + toNumber(b.totalAmount), 0);
  const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

  const byChannel = {};
  bookings.forEach((b) => {
    const ch = detectOtaChannel(b);
    if (!byChannel[ch]) byChannel[ch] = { channel: ch, bookings: 0, revenue: 0 };
    byChannel[ch].bookings += 1;
    byChannel[ch].revenue += toNumber(b.totalAmount);
  });
  const channelArray = Object.values(byChannel);
  const otaBookings = channelArray
    .filter((x) => x.channel !== 'Direct' && x.channel !== 'Website')
    .reduce((sum, x) => sum + x.bookings, 0);
  const otaPercentage = totalBookings > 0 ? (otaBookings / totalBookings) * 100 : 0;

  const avgRoomRate = averageBookingValue; // approximate

  return {
    totalBookings,
    totalRevenue,
    averageRoomRate: avgRoomRate,
    otaBookingPercentage: otaPercentage,
    otaChannels: channelArray,
  };
}

function buildRoomCategoryRevenue(bookings) {
  const byType = {};
  bookings.forEach((b) => {
    const rt = (b.roomType || 'Unknown').toString();
    if (!byType[rt]) byType[rt] = { roomType: rt, revenue: 0, bookings: 0 };
    byType[rt].revenue += toNumber(b.totalAmount);
    byType[rt].bookings += 1;
  });
  return Object.values(byType);
}

function summarizeCampaigns(bookings) {
  const map = {};
  bookings.forEach((b) => {
    const extras = b.extras || {};
    const campaign =
      extras.campaignCode || extras.promoCode || extras.campaignName || extras.marketingTag;
    if (!campaign) return;
    const name = campaign.toString();
    if (!map[name]) map[name] = { campaign: name, bookings: 0, revenue: 0 };
    map[name].bookings += 1;
    map[name].revenue += toNumber(b.totalAmount);
  });
  return Object.values(map);
}

function summarizeOtaChannels(bookings) {
  const byChannel = {};
  bookings.forEach((b) => {
    const ch = detectOtaChannel(b);
    if (!byChannel[ch]) byChannel[ch] = { channel: ch, bookings: 0, revenue: 0 };
    byChannel[ch].bookings += 1;
    byChannel[ch].revenue += toNumber(b.totalAmount);
  });
  return Object.values(byChannel);
}

function buildRatePlanPerformance(bookings) {
  return aggregateBy(bookings, 'ratePlan', (b) => b.totalAmount);
}

function buildRoomPricingOverview(rooms, bookings) {
  const byTypeRoom = {};
  rooms.forEach((r) => {
    const rt = (r.roomType || 'Unknown').toString();
    if (!byTypeRoom[rt]) byTypeRoom[rt] = { roomType: rt, rooms: 0, basePriceSum: 0 };
    byTypeRoom[rt].rooms += 1;
    byTypeRoom[rt].basePriceSum += toNumber(r.pricePerNight);
  });

  const byTypeBooking = {};
  bookings.forEach((b) => {
    const rt = (b.roomType || 'Unknown').toString();
    if (!byTypeBooking[rt]) byTypeBooking[rt] = { roomType: rt, bookings: 0, revenue: 0 };
    byTypeBooking[rt].bookings += 1;
    byTypeBooking[rt].revenue += toNumber(b.totalAmount);
  });

  const result = [];
  const types = new Set([
    ...Object.keys(byTypeRoom),
    ...Object.keys(byTypeBooking),
  ]);
  types.forEach((rt) => {
    const r = byTypeRoom[rt] || { rooms: 0, basePriceSum: 0 };
    const b = byTypeBooking[rt] || { bookings: 0, revenue: 0 };
    const currentPrice =
      r.rooms > 0 ? r.basePriceSum / r.rooms : 0;
    const avgBookedRate =
      b.bookings > 0 ? b.revenue / b.bookings : 0;
    const priceChange = currentPrice > 0 ? ((avgBookedRate - currentPrice) / currentPrice) * 100 : 0;
    result.push({
      roomType: rt,
      currentPrice,
      averageBookedRate: avgBookedRate,
      priceChange,
      bookings: b.bookings,
    });
  });
  return result;
}

function buildDailyBookingTrend(bookings) {
  const map = {};
  bookings.forEach((b) => {
    const d = (b.createdAt || b.checkIn || '').toString().slice(0, 10);
    if (!d) return;
    if (!map[d]) map[d] = { date: d, bookings: 0, revenue: 0 };
    map[d].bookings += 1;
    map[d].revenue += toNumber(b.totalAmount);
  });
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
}

function buildRecentMarketingActivity(bookings, limit = 10) {
  const sorted = [...bookings].sort((a, b) =>
    (b.createdAt || '').toString().localeCompare((a.createdAt || '').toString()),
  );
  return sorted.slice(0, limit).map((b) => {
    const extras = b.extras || {};
    const hasCampaign = !!(extras.campaignCode || extras.promoCode || extras.campaignName);
    const title = hasCampaign
      ? 'Campaign booking'
      : 'New booking';
    const description = hasCampaign
      ? `Booking ${b.bookingNumber} via campaign ${extras.campaignCode || extras.campaignName || extras.promoCode}`
      : `Booking ${b.bookingNumber} for ${b.guestName || 'Guest'}`;
    return {
      id: b.id,
      date: (b.createdAt || '').toString(),
      title,
      description,
      roomType: b.roomType || null,
      ratePlan: b.ratePlan || null,
    };
  });
}

module.exports = {
  buildMarketingOverview,
  buildRoomCategoryRevenue,
  summarizeCampaigns,
  summarizeOtaChannels,
  buildRatePlanPerformance,
  buildRoomPricingOverview,
  buildDailyBookingTrend,
  buildRecentMarketingActivity,
};

