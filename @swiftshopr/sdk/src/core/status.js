// @swiftshopr/sdk/src/core/status.js

/**
 * Get the status of a payment by intent ID or order ID.
 *
 * @param {Object} params
 * @param {string} params.id - Intent ID (UUID) or order ID
 * @param {string} [params.by] - 'intent' or 'order' (auto-detects if not specified)
 * @param {string} params.apiBaseUrl - Required. Backend base URL
 * @param {string} params.apiKey - Required. Retailer API key (x-swiftshopr-key)
 * @returns {Promise<Object>} Payment status object
 */
export const getPaymentStatus = async ({
  id,
  by,
  apiBaseUrl,
  apiKey,
}) => {
  if (!apiBaseUrl) {
    throw new Error('Missing apiBaseUrl for payment status');
  }
  if (!apiKey) {
    throw new Error('Missing apiKey for payment status');
  }
  if (!id) {
    throw new Error('Missing payment ID');
  }

  const queryParams = by ? `?by=${by}` : '';
  const url = `${apiBaseUrl.replace(/\/$/, '')}/api/v1/sdk/onramp/payments/${encodeURIComponent(id)}/status${queryParams}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-swiftshopr-key': apiKey,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return {
        success: false,
        error: 'not_found',
        message: 'Payment not found',
      };
    }
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody?.message || `Payment status check failed (${response.status})`);
  }

  const payload = await response.json();

  return {
    success: true,
    intentId: payload.intent_id,
    orderId: payload.order_id,
    status: payload.status,
    amountUsd: payload.amount_usd,
    storeId: payload.store_id,
    destinationAddress: payload.destination_address,
    txHash: payload.tx_hash,
    confirmedAt: payload.confirmed_at,
    createdAt: payload.created_at,
    expiresAt: payload.expires_at,
    isExpired: payload.is_expired,
    explorerUrl: payload.explorer_url,
  };
};

/**
 * Poll for payment completion with configurable timeout and interval.
 *
 * @param {Object} params
 * @param {string} params.intentId - Payment intent ID to poll
 * @param {string} params.apiBaseUrl - Backend base URL
 * @param {string} params.apiKey - Retailer API key
 * @param {number} [params.timeoutMs=120000] - Maximum time to wait (default 2 minutes)
 * @param {number} [params.intervalMs=3000] - Polling interval (default 3 seconds)
 * @param {Function} [params.onStatusChange] - Callback when status changes
 * @returns {Promise<Object>} Final payment status
 */
export const pollPaymentStatus = async ({
  intentId,
  apiBaseUrl,
  apiKey,
  timeoutMs = 120000,
  intervalMs = 3000,
  onStatusChange,
}) => {
  const startTime = Date.now();
  let lastStatus = null;

  while (Date.now() - startTime < timeoutMs) {
    const result = await getPaymentStatus({
      id: intentId,
      apiBaseUrl,
      apiKey,
    });

    if (result.status !== lastStatus) {
      lastStatus = result.status;
      onStatusChange?.(result);
    }

    if (result.status === 'completed') {
      return { success: true, ...result };
    }

    if (result.status === 'failed' || result.status === 'canceled') {
      return { success: false, ...result };
    }

    if (result.isExpired) {
      return { success: false, error: 'expired', ...result };
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return {
    success: false,
    error: 'timeout',
    message: `Payment status polling timed out after ${timeoutMs}ms`,
  };
};

export default {
  getPaymentStatus,
  pollPaymentStatus,
};
