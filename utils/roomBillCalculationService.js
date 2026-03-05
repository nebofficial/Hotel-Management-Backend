const { computeGstSplit, round2 } = require('./gstService');

function sumExtras(extras) {
  const rows = Array.isArray(extras) ? extras : [];
  return round2(
    rows.reduce((s, x) => {
      const qty = Number(x.qty || 0);
      const rate = Number(x.rate || 0);
      const amount = x.amount != null ? Number(x.amount) : qty * rate;
      return s + (Number.isFinite(amount) ? amount : 0);
    }, 0)
  );
}

function clamp01(n) {
  const x = Number(n || 0);
  if (x < 0) return 0;
  return x;
}

/**
 * Calculates room bill totals from inputs.
 */
function calculateRoomBill(payload) {
  const nights = Math.max(1, parseInt(payload.nights || 1, 10));
  const pricePerNight = clamp01(payload.pricePerNight);
  const lateCheckoutCharge = clamp01(payload.lateCheckoutCharge);
  const extraBedCharge = clamp01(payload.extraBedCharge);

  const roomSubtotal = round2(pricePerNight * nights + lateCheckoutCharge + extraBedCharge);
  const extrasSubtotal = round2(sumExtras(payload.extras));
  const subtotal = round2(roomSubtotal + extrasSubtotal);

  const discountAmount = clamp01(payload.discountAmount);
  const discountPercent = clamp01(payload.discountPercent);

  const discountFromPercent = round2((subtotal * discountPercent) / 100);
  const discountTotal = round2(Math.min(subtotal, discountAmount + discountFromPercent));

  const taxableAmount = round2(Math.max(0, subtotal - (payload.applyDiscountBeforeTax !== false ? discountTotal : 0)));
  const gstPercent = clamp01(payload.gstPercent);
  const gst = computeGstSplit({
    taxableAmount,
    gstPercent,
    hotelState: payload.hotelState,
    placeOfSupplyState: payload.placeOfSupplyState,
  });

  const serviceChargeEnabled = Boolean(payload.serviceChargeEnabled);
  const serviceChargePercent = clamp01(payload.serviceChargePercent);
  const serviceChargeAmount = serviceChargeEnabled ? round2((taxableAmount * serviceChargePercent) / 100) : 0;

  const grandTotal = round2(
    taxableAmount +
      gst.taxTotal +
      serviceChargeAmount +
      (payload.applyDiscountBeforeTax === false ? -discountTotal : 0)
  );

  const advancePaid = clamp01(payload.advancePaid);
  const advanceAdjusted = round2(Math.min(advancePaid, grandTotal));
  const netPayable = round2(Math.max(0, grandTotal - advanceAdjusted));

  return {
    nights,
    roomSubtotal,
    extrasSubtotal,
    subtotal,
    discountTotal,
    taxableAmount,
    cgst: gst.cgst,
    sgst: gst.sgst,
    igst: gst.igst,
    taxTotal: gst.taxTotal,
    serviceChargeAmount,
    grandTotal,
    advancePaid,
    advanceAdjusted,
    netPayable,
    isInterState: gst.isInterState,
  };
}

module.exports = { calculateRoomBill };

