function trackCreditExpiry(creditNotes = [], { daysThreshold = 7 } = {}) {
  const now = new Date();
  const soon = new Date();
  soon.setDate(now.getDate() + daysThreshold);

  const results = creditNotes.map((c) => {
    const expiry = c.expiryDate ? new Date(c.expiryDate) : null;
    let status = 'VALID';
    if (expiry) {
      if (expiry < now) status = 'EXPIRED';
      else if (expiry >= now && expiry <= soon) status = 'EXPIRING_SOON';
    }
    return {
      id: c.id,
      creditNoteNumber: c.creditNoteNumber,
      guestName: c.guestName,
      totalAmount: Number(c.totalAmount || 0),
      usedAmount: Number(c.usedAmount || 0),
      expiryDate: c.expiryDate,
      status,
    };
  });

  const expiringSoon = results.filter((r) => r.status === 'EXPIRING_SOON');
  const expired = results.filter((r) => r.status === 'EXPIRED');

  return {
    items: results,
    expiringSoon,
    expired,
  };
}

module.exports = { trackCreditExpiry };

