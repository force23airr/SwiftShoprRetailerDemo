// @swiftshopr/sdk/src/core/onramp.js
import * as WebBrowser from 'expo-web-browser';

const sanitizeAmount = (amountUsd) => {
  const numeric = Number(amountUsd);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new Error('Invalid payment amount');
  }
  return numeric.toFixed(2);
};

export const openOnramp = async ({
  amountUsd,
  walletAddress,
  storeId,
  orderId,
  apiBaseUrl,
  apiKey,
  paymentCurrency = 'USD',
  paymentMethod = 'ACH_BANK_ACCOUNT',
  onrampRoute = '/api/v1/sdk/onramp/session',
}) => {
  if (!apiBaseUrl) {
    throw new Error('Missing apiBaseUrl for onramp session');
  }
  if (!walletAddress || !walletAddress.startsWith('0x')) {
    throw new Error('Missing wallet address for onramp');
  }
  if (!storeId) {
    throw new Error('Missing storeId for onramp session');
  }

  const paymentAmount = sanitizeAmount(amountUsd);
  const url = `${apiBaseUrl.replace(/\/$/, '')}${onrampRoute}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'x-swiftshopr-key': apiKey } : {}),
    },
    body: JSON.stringify({
      destinationAddress: walletAddress,
      paymentAmount,
      paymentCurrency,
      paymentMethod,
      storeId,
      ...(orderId ? { orderId } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`Onramp session failed (${response.status})`);
  }

  const payload = await response.json();
  if (!payload?.onramp_url) {
    throw new Error('Onramp session missing onramp_url');
  }

  const browserResult = await WebBrowser.openAuthSessionAsync(payload.onramp_url);

  return {
    browserResult,
    intentId: payload.intent_id,
    sessionId: payload.session_id,
    quoteId: payload.quote_id,
    orderId: payload.order_id,
    branding: payload.branding,
  };
};

export default {
  openOnramp,
};
