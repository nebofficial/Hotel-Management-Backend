/**
 * Build basic analytics series from campaigns list.
 */

function buildUsageTrend(campaigns = []) {
  // Aggregate by createdAt date
  const map = {};
  campaigns.forEach((c) => {
    const d = (c.createdAt || c.scheduledAt || '').toString().slice(0, 10);
    if (!d) return;
    if (!map[d]) map[d] = { date: d, count: 0, sent: 0 };
    map[d].count += 1;
    map[d].sent += Number(c.sentCount || 0);
  });
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
}

function buildTopCampaigns(campaigns = []) {
  return [...campaigns]
    .sort((a, b) => Number(b.sentCount || 0) - Number(a.sentCount || 0))
    .slice(0, 10)
    .map((c) => ({
      name: c.name,
      sent: Number(c.sentCount || 0),
      type: c.type,
    }));
}

function buildDistribution(campaigns = []) {
  const email = campaigns
    .filter((c) => c.type === 'email')
    .reduce((sum, c) => sum + Number(c.sentCount || 0), 0);
  const sms = campaigns
    .filter((c) => c.type === 'sms')
    .reduce((sum, c) => sum + Number(c.sentCount || 0), 0);
  return [
    { name: 'Email', value: email },
    { name: 'SMS', value: sms },
  ];
}

module.exports = {
  buildUsageTrend,
  buildTopCampaigns,
  buildDistribution,
};

