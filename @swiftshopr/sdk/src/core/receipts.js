// @swiftshopr/sdk/src/core/receipts.js

/**
 * Generate a digital receipt after payment completion.
 *
 * @param {Object} params
 * @param {string} params.intentId - Payment intent ID from createTransferIntent
 * @param {string} params.storeId - Store ID
 * @param {Array} params.items - Cart items
 * @param {number} params.total - Total amount
 * @param {string} [params.orderId] - Retailer order ID
 * @param {string} params.apiBaseUrl - Backend base URL
 * @param {string} params.apiKey - Retailer API key
 * @returns {Promise<Object>} Receipt with QR code data for exit verification
 */
export const generateReceipt = async ({
  intentId,
  storeId,
  items,
  total,
  orderId,
  apiBaseUrl,
  apiKey,
}) => {
  if (!apiBaseUrl) {
    throw new Error('Missing apiBaseUrl for receipt generation');
  }
  if (!apiKey) {
    throw new Error('Missing apiKey for receipt generation');
  }
  if (!intentId) {
    throw new Error('Missing intentId for receipt generation');
  }
  if (!storeId) {
    throw new Error('Missing storeId for receipt generation');
  }

  const url = `${apiBaseUrl.replace(/\/$/, '')}/api/v1/sdk/receipts`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-swiftshopr-key': apiKey,
    },
    body: JSON.stringify({
      intent_id: intentId,
      store_id: storeId,
      order_id: orderId,
      items: items.map((item) => ({
        barcode: item.barcode,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      total,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody?.message || `Receipt generation failed (${response.status})`);
  }

  const payload = await response.json();

  return {
    success: true,
    receiptId: payload.receipt_id,
    qrData: payload.qr_data,
    qrUrl: payload.qr_url,
    createdAt: payload.created_at,
    expiresAt: payload.expires_at,
    items: payload.items,
    total: payload.total,
    storeId: payload.store_id,
    intentId: payload.intent_id,
  };
};

/**
 * Get receipt details by receipt ID.
 *
 * @param {Object} params
 * @param {string} params.receiptId - Receipt ID
 * @param {string} params.apiBaseUrl - Backend base URL
 * @param {string} params.apiKey - Retailer API key
 * @returns {Promise<Object>} Receipt details
 */
export const getReceipt = async ({
  receiptId,
  apiBaseUrl,
  apiKey,
}) => {
  if (!receiptId) {
    throw new Error('Missing receiptId');
  }

  const url = `${apiBaseUrl.replace(/\/$/, '')}/api/v1/sdk/receipts/${encodeURIComponent(receiptId)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-swiftshopr-key': apiKey,
    },
  });

  if (response.status === 404) {
    return { success: false, error: 'not_found' };
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody?.message || `Receipt fetch failed (${response.status})`);
  }

  const payload = await response.json();

  return {
    success: true,
    receiptId: payload.receipt_id,
    qrData: payload.qr_data,
    items: payload.items,
    total: payload.total,
    storeId: payload.store_id,
    intentId: payload.intent_id,
    status: payload.status,
    createdAt: payload.created_at,
    verifiedAt: payload.verified_at,
  };
};

/**
 * Get receipt by payment intent ID.
 *
 * @param {Object} params
 * @param {string} params.intentId - Payment intent ID
 * @param {string} params.apiBaseUrl - Backend base URL
 * @param {string} params.apiKey - Retailer API key
 * @returns {Promise<Object>} Receipt details
 */
export const getReceiptByIntent = async ({
  intentId,
  apiBaseUrl,
  apiKey,
}) => {
  if (!intentId) {
    throw new Error('Missing intentId');
  }

  const url = `${apiBaseUrl.replace(/\/$/, '')}/api/v1/sdk/receipts/intent/${encodeURIComponent(intentId)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-swiftshopr-key': apiKey,
    },
  });

  if (response.status === 404) {
    return { success: false, error: 'not_found' };
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody?.message || `Receipt fetch failed (${response.status})`);
  }

  const payload = await response.json();

  return {
    success: true,
    receiptId: payload.receipt_id,
    qrData: payload.qr_data,
    items: payload.items,
    total: payload.total,
    storeId: payload.store_id,
    intentId: payload.intent_id,
    status: payload.status,
    createdAt: payload.created_at,
  };
};

export default {
  generateReceipt,
  getReceipt,
  getReceiptByIntent,
};
