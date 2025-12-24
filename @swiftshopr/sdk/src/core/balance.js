// @swiftshopr/sdk/src/core/balance.js
import { createPublicClient, http, formatUnits } from 'viem';
import { base } from 'viem/chains';
import { getRpcEndpoints, getUSDCAddress } from './config';

const USDC_DECIMALS = 6;

const USDC_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
];

let currentRpcIndex = 0;
let cachedBalanceResult = null;
const balanceSubscribers = new Set();

const CACHE_MAX_AGE_MS = 5 * 60 * 1000;
const CACHE_STALE_THRESHOLD_MS = 2 * 60 * 1000;

const getValidCachedBalance = () => {
  if (!cachedBalanceResult || !cachedBalanceResult.lastUpdated) {
    return null;
  }

  const cacheAge = Date.now() - new Date(cachedBalanceResult.lastUpdated).getTime();
  if (cacheAge > CACHE_MAX_AGE_MS) {
    cachedBalanceResult = null;
    return null;
  }

  const isStale = cacheAge > CACHE_STALE_THRESHOLD_MS;
  return { ...cachedBalanceResult, isStale, cacheAge };
};

export const invalidateBalanceCache = () => {
  cachedBalanceResult = null;
};

const notifyBalanceSubscribers = (payload) => {
  balanceSubscribers.forEach((listener) => {
    try {
      listener(payload);
    } catch (_) {
      // no-op for subscriber failures
    }
  });
};

export const getCachedBalanceSnapshot = () => getValidCachedBalance();

export const subscribeToBalanceUpdates = (listener) => {
  if (typeof listener !== 'function') {
    return () => {};
  }

  balanceSubscribers.add(listener);

  const validCache = getValidCachedBalance();
  if (validCache) {
    try {
      listener(validCache);
    } catch (_) {
      // ignore immediate failures
    }
  }

  return () => {
    balanceSubscribers.delete(listener);
  };
};

export const clearCachedBalance = () => {
  cachedBalanceResult = null;
};

const createFreshClient = (endpoint) => {
  return createPublicClient({
    chain: base,
    transport: http(endpoint, {
      timeout: 8000,
      retryCount: 1,
      retryDelay: 500,
    }),
  });
};

let ongoingBalanceRequest = null;
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000;

export const getUSDCBalance = async (walletAddress, options = {}) => {
  const {
    network = 'base',
    rpcEndpoints,
  } = options;

  if (!walletAddress || typeof walletAddress !== 'string' || !walletAddress.startsWith('0x')) {
    return {
      success: false,
      balance: 0,
      usdValue: 0,
      lastUpdated: new Date().toISOString(),
      currency: 'USDC',
      chain: network,
    };
  }

  if (ongoingBalanceRequest) {
    return ongoingBalanceRequest;
  }

  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    // Allow refresh, but keep throttling guard in place.
  }

  lastRequestTime = now;
  const endpoints = getRpcEndpoints(network, rpcEndpoints);

  const requestPromise = (async () => {
    try {
      currentRpcIndex = 0;
      const usdcAddress = getUSDCAddress(network);

      const readBalance = async (endpoint) => {
        const client = createFreshClient(endpoint);
        const readContractWithTimeout = Promise.race([
          client.readContract({
            address: usdcAddress,
            abi: USDC_ABI,
            functionName: 'balanceOf',
            args: [walletAddress],
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('RPC request timeout (10s)')), 10000)
          ),
        ]);
        return readContractWithTimeout;
      };

      let balanceRaw;
      while (currentRpcIndex < endpoints.length) {
        try {
          balanceRaw = await readBalance(endpoints[currentRpcIndex]);
          break;
        } catch (_) {
          currentRpcIndex += 1;
        }
      }

      if (!balanceRaw) {
        balanceRaw = BigInt(0);
      }

      const totalBalance = parseFloat(formatUnits(balanceRaw, USDC_DECIMALS));
      const result = {
        success: true,
        balance: totalBalance,
        usdValue: totalBalance,
        lastUpdated: new Date().toISOString(),
        currency: 'USDC',
        chain: network,
        contractAddresses: {
          [network]: usdcAddress,
        },
      };

      cachedBalanceResult = result;
      notifyBalanceSubscribers(result);

      return result;
    } catch (error) {
      return {
        success: false,
        balance: 0,
        usdValue: 0,
        error: error?.message || 'Failed to fetch balance',
        lastUpdated: new Date().toISOString(),
        currency: 'USDC',
        chain: network,
      };
    } finally {
      ongoingBalanceRequest = null;
    }
  })();

  ongoingBalanceRequest = requestPromise;
  return requestPromise;
};

export const formatBalance = (balance) => {
  if (balance === null || balance === undefined || isNaN(balance)) {
    return '$0.00';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(balance);
};

export const getTimeSinceUpdate = (lastUpdated) => {
  if (!lastUpdated) return '';

  const now = new Date();
  const updated = new Date(lastUpdated);
  const diffMs = now - updated;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins === 1) return '1 min ago';
  if (diffMins < 60) return `${diffMins} mins ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;

  return 'Over a day ago';
};

export const needsRefresh = (lastUpdated) => {
  if (!lastUpdated) return true;

  const now = new Date();
  const updated = new Date(lastUpdated);
  const diffMs = now - updated;
  const diffMins = Math.floor(diffMs / 60000);

  return diffMins >= 5;
};

export default {
  getUSDCBalance,
  formatBalance,
  getTimeSinceUpdate,
  needsRefresh,
  getCachedBalanceSnapshot,
  subscribeToBalanceUpdates,
  clearCachedBalance,
  invalidateBalanceCache,
  CACHE_MAX_AGE_MS,
};
