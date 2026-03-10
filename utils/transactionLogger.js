/**
 * Simple helper to log payment transactions into PaymentTransaction model.
 */

/**
 * 
 * @param {{ PaymentTransaction: any }} hotelModels 
 * @param {{ methodId?: string, methodName?: string, amount: number, currency?: string, direction?: string, status?: string, reference?: string, meta?: any }} payload 
 * @returns 
 */
async function logTransaction(hotelModels, payload) {
  const { PaymentTransaction } = hotelModels;
  if (!PaymentTransaction) {
    throw new Error("PaymentTransaction model not available");
  }
  await PaymentTransaction.sync();
  const tx = await PaymentTransaction.create({
    amount: Number(payload.amount || 0),
    currency: payload.currency || "USD",
    direction: payload.direction || "IN",
    status: payload.status || "PENDING",
    methodId: payload.methodId || null,
    methodName: payload.methodName || null,
    reference: payload.reference || null,
    meta: payload.meta || null,
  });
  return tx;
}

module.exports = {
  logTransaction,
};

