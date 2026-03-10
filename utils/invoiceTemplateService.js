const { generateCombinedInvoice } = require('./invoiceGenerator');

/**
 * Build a preview payload for an invoice template.
 * For now this returns JSON that the frontend can render nicely;
 * later this could return HTML/PDF.
 */
async function buildInvoicePreview(template, sampleData = {}) {
  const safeTemplate = template || {};
  const branding = safeTemplate.branding || {};
  const fieldsConfig = safeTemplate.fieldsConfig || {};

  // Minimal fake combined invoice payload
  const invoice = generateCombinedInvoice({
    hotelProfile: sampleData.hotelProfile || {
      name: branding.hotelName || "Sample Hotel",
      address: branding.address || "Sample Street, Sample City",
      logoUrl: branding.logoUrl || null,
    },
    booking: sampleData.booking || {
      guestName: "John Doe",
      roomNumber: "101",
      checkIn: "2026-03-08",
      checkOut: "2026-03-09",
      nights: 1,
    },
    folio: sampleData.folio || {
      ledger: {
        roomChargesTotal: 100,
        restaurantChargesTotal: 40,
        otherChargesTotal: 10,
      },
    },
    breakdowns: sampleData.breakdowns || [],
    payments: sampleData.payments || [],
    invoiceNumber: "INV-PREVIEW-001",
  });

  return {
    template: {
      id: safeTemplate.id,
      name: safeTemplate.name,
      layoutStyle: safeTemplate.layoutStyle,
      taxDisplayMode: safeTemplate.taxDisplayMode,
      branding,
      fieldsConfig,
      footerNotes: safeTemplate.footerNotes || "",
    },
    invoice,
  };
}

module.exports = {
  buildInvoicePreview,
};

