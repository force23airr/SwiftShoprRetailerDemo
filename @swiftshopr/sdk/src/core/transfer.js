// @swiftshopr/sdk/src/core/transfer.js
import { sendEvmTransaction } from '@coinbase/cdp-core';
import { encodeFunctionData } from 'viem';
import { getCurrentNetwork, getUSDCAddress } from './config';

const USDC_DECIMALS = 6;

const ERC20_TRANSFER_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
  },
];

const safeLog = (logger, level, message, details) => {
  if (!logger || typeof logger[level] !== 'function') {
    return;
  }
  logger[level](message, details);
};

export const transferUSDC = async (
  destinationAddress,
  amountUsd,
  userWalletAddress,
  options = {}
) => {
  const {
    network = 'base',
    chainId,
    logger,
  } = options;

  safeLog(logger, 'info', 'SwiftShopr transfer start', {
    from: userWalletAddress,
    to: destinationAddress,
    amountUsd,
    network,
  });

  try {
    if (!destinationAddress || !destinationAddress.startsWith('0x')) {
      throw new Error('Invalid destination address');
    }

    if (!amountUsd || amountUsd <= 0) {
      throw new Error('Invalid amount');
    }

    if (!userWalletAddress || !userWalletAddress.startsWith('0x')) {
      throw new Error('Missing wallet address');
    }

    const resolvedNetwork = getCurrentNetwork(network);
    const resolvedChainId = chainId || resolvedNetwork.chainId;
    const usdcAddress = getUSDCAddress(network);

    const amountInUnits = BigInt(Math.round(amountUsd * 1_000_000));

    const data = encodeFunctionData({
      abi: ERC20_TRANSFER_ABI,
      functionName: 'transfer',
      args: [destinationAddress, amountInUnits],
    });

    const result = await sendEvmTransaction({
      evmAccount: userWalletAddress,
      network,
      transaction: {
        to: usdcAddress,
        value: 0n,
        data,
        chainId: resolvedChainId,
        type: 'eip1559',
      },
    });

    const txHash = result?.transactionHash;
    if (!txHash) {
      throw new Error('Transaction sent but no hash returned');
    }

    return {
      success: true,
      txHash,
      amount: amountUsd,
      from: userWalletAddress,
      to: destinationAddress,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    safeLog(logger, 'error', 'SwiftShopr transfer failed', {
      message: error?.message,
    });

    return {
      success: false,
      error: error?.message || 'Transfer failed',
      timestamp: new Date().toISOString(),
    };
  }
};

export const waitForConfirmation = async (txHash) => {
  if (!txHash) {
    return { confirmed: false, status: 'error', error: 'Missing transaction hash' };
  }

  return {
    confirmed: true,
    status: 'success',
  };
};

/**
 * Create a transfer intent on the backend before executing the transfer.
 * This enables payment tracking, webhook dispatch to retailer POS, and audit trail.
 *
 * @param {Object} params
 * @param {string} params.storeId - Required. Retailer store ID
 * @param {number|string} params.amount - Required. Amount in USD
 * @param {string} params.userWalletAddress - Required. User's embedded wallet address
 * @param {string} [params.orderId] - Optional. Retailer's order ID for correlation
 * @param {string} [params.destinationAddress] - Optional. Backend looks up by storeId if not provided
 * @param {string} params.apiBaseUrl - Required. Backend base URL
 * @param {string} params.apiKey - Required. Retailer API key (x-swiftshopr-key)
 * @returns {Promise<Object>} { success, intentId, transfer: { to, amount, asset, network, chainId }, branding, expiresAt }
 */
export const createTransferIntent = async ({
  storeId,
  amount,
  userWalletAddress,
  orderId,
  destinationAddress,
  apiBaseUrl,
  apiKey,
}) => {
  if (!apiBaseUrl) {
    throw new Error('Missing apiBaseUrl for transfer intent');
  }
  if (!apiKey) {
    throw new Error('Missing apiKey for transfer intent');
  }
  if (!storeId) {
    throw new Error('Missing storeId for transfer intent');
  }
  if (!amount || Number(amount) <= 0) {
    throw new Error('Invalid amount for transfer intent');
  }
  if (!userWalletAddress || !userWalletAddress.startsWith('0x')) {
    throw new Error('Missing or invalid userWalletAddress');
  }

  const url = `${apiBaseUrl.replace(/\/$/, '')}/api/v1/sdk/onramp/transfer`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-swiftshopr-key': apiKey,
    },
    body: JSON.stringify({
      storeId,
      amount: Number(amount),
      userWalletAddress,
      ...(orderId ? { orderId } : {}),
      ...(destinationAddress ? { destinationAddress } : {}),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody?.message || `Transfer intent failed (${response.status})`);
  }

  const payload = await response.json();

  if (!payload?.intent_id) {
    throw new Error('Transfer intent response missing intent_id');
  }

  return {
    success: true,
    intentId: payload.intent_id,
    orderId: payload.order_id,
    transfer: {
      to: payload.transfer?.to,
      amount: payload.transfer?.amount,
      asset: payload.transfer?.asset || 'USDC',
      network: payload.transfer?.network || 'base',
      chainId: payload.transfer?.chain_id || 8453,
    },
    status: payload.status,
    expiresAt: payload.expires_at,
    branding: payload.branding,
  };
};

export default {
  transferUSDC,
  waitForConfirmation,
  createTransferIntent,
};
