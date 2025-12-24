// @swiftshopr/sdk/src/components/SwiftShoprProvider.jsx
import React, { createContext, useContext, useMemo } from 'react';
import { CDPHooksProvider } from '@coinbase/cdp-hooks';
import { normalizeConfig } from '../core/config';

const SwiftShoprContext = createContext(null);

export const SwiftShoprProvider = ({ config, children }) => {
  const normalized = useMemo(() => normalizeConfig(config), [config]);

  if (!normalized.cdpConfig?.projectId) {
    throw new Error('SwiftShoprProvider requires config.projectId');
  }

  return (
    <SwiftShoprContext.Provider value={normalized}>
      <CDPHooksProvider config={normalized.cdpConfig}>
        {children}
      </CDPHooksProvider>
    </SwiftShoprContext.Provider>
  );
};

export const useSwiftShoprConfig = () => {
  const context = useContext(SwiftShoprContext);
  if (!context) {
    throw new Error('useSwiftShoprConfig must be used within SwiftShoprProvider');
  }
  return context;
};

export default SwiftShoprProvider;
