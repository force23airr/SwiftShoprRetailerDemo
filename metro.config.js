// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Block optional Wagmi connector dependencies that we don't need
// We only use Coinbase connector, so block all others
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const blockedModules = [
    '@base-org/account',
    '@gemini-wallet/core',
    '@walletconnect/ethereum-provider',
    '@safe-global/protocol-kit',
    '@safe-global/safe-apps-provider',
    '@safe-global/safe-apps-sdk',
    '@metamask/sdk',
    'porto',
  ];

  const shouldBlock = blockedModules.some(blocked =>
    moduleName === blocked || moduleName.startsWith(blocked + '/')
  );

  if (shouldBlock) {
    return { type: 'empty' };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
