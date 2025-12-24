// @swiftshopr/sdk/src/core/config.js
import { http } from 'viem';
import { base } from 'viem/chains';

export const DEFAULT_NETWORK = 'base';

export const SUPPORTED_NETWORKS = {
  'base': {
    name: 'Base',
    chainId: 8453,
    isTestnet: false,
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorer: 'https://basescan.org',
  },
  'base-sepolia': {
    name: 'Base Sepolia',
    chainId: 84532,
    isTestnet: true,
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorer: 'https://sepolia.basescan.org',
  },
};

export const USDC_ADDRESSES = {
  'base': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  'base-sepolia': '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
};

export const DEFAULT_RPC_ENDPOINTS = {
  'base': [
    'https://mainnet.base.org',
    'https://base-rpc.publicnode.com',
    'https://base.llamarpc.com',
  ],
  'base-sepolia': [
    'https://sepolia.base.org',
    'https://base-sepolia-rpc.publicnode.com',
  ],
};

export const getCurrentNetwork = (network = DEFAULT_NETWORK) => {
  return SUPPORTED_NETWORKS[network] || SUPPORTED_NETWORKS[DEFAULT_NETWORK];
};

export const getUSDCAddress = (network = DEFAULT_NETWORK) => {
  return USDC_ADDRESSES[network] || USDC_ADDRESSES[DEFAULT_NETWORK];
};

export const getRpcEndpoints = (network = DEFAULT_NETWORK, overrides = []) => {
  if (Array.isArray(overrides) && overrides.length > 0) {
    return overrides;
  }
  return DEFAULT_RPC_ENDPOINTS[network] || DEFAULT_RPC_ENDPOINTS[DEFAULT_NETWORK];
};

export const createCDPConfig = ({
  projectId,
  network = DEFAULT_NETWORK,
  appName = 'SwiftShopr',
  basePath = 'https://api.cdp.coinbase.com/platform',
  debugging = false,
  useMock = false,
  createOnLogin = 'smart',
  rpcUrl,
} = {}) => {
  const resolvedNetwork = SUPPORTED_NETWORKS[network] ? network : DEFAULT_NETWORK;
  const chainConfig = SUPPORTED_NETWORKS[resolvedNetwork];
  const defaultRpcUrl = rpcUrl || DEFAULT_RPC_ENDPOINTS[resolvedNetwork]?.[0];

  return {
    projectId,
    basePath,
    useMock,
    debugging,
    network: resolvedNetwork,
    ethereum: {
      createOnLogin,
      chains: [
        {
          id: chainConfig.chainId,
          rpcUrl: defaultRpcUrl,
        },
      ],
    },
    transports: {
      [base.id]: http(defaultRpcUrl),
    },
    appName,
  };
};

export const normalizeConfig = (input = {}) => {
  const cdpConfig = createCDPConfig({
    projectId: input.projectId || input.cdpProjectId,
    network: input.network,
    appName: input.appName,
    basePath: input.basePath,
    debugging: input.debugging,
    useMock: input.useMock,
    createOnLogin: input.createOnLogin,
    rpcUrl: input.rpcUrl,
  });

  return {
    ...input,
    network: cdpConfig.network,
    apiBaseUrl: input.apiBaseUrl || '',
    apiKey: input.apiKey || '',
    onrampUrl: input.onrampUrl || '',
    onrampRoute: input.onrampRoute || '/api/v1/sdk/onramp/session',
    paymentCurrency: input.paymentCurrency || 'USD',
    paymentMethod: input.paymentMethod || 'ACH_BANK_ACCOUNT',
    rpcEndpoints: getRpcEndpoints(cdpConfig.network, input.rpcEndpoints),
    cdpConfig,
  };
};

export default {
  DEFAULT_NETWORK,
  SUPPORTED_NETWORKS,
  USDC_ADDRESSES,
  DEFAULT_RPC_ENDPOINTS,
  getCurrentNetwork,
  getUSDCAddress,
  getRpcEndpoints,
  createCDPConfig,
  normalizeConfig,
};
