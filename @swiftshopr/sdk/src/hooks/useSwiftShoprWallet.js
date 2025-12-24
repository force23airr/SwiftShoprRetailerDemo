// @swiftshopr/sdk/src/hooks/useSwiftShoprWallet.js
import { useCallback } from 'react';
import {
  useIsInitialized,
  useIsSignedIn,
  useCurrentUser,
  useEvmAddress,
  useSignInWithEmail,
  useVerifyEmailOTP,
  useSignOut,
  useCreateEvmSmartAccount,
} from '@coinbase/cdp-hooks';
import { initialize as cdpInitialize } from '@coinbase/cdp-core';
import { useSwiftShoprConfig } from '../components/SwiftShoprProvider';

export const useSwiftShoprWallet = () => {
  const { cdpConfig } = useSwiftShoprConfig();

  const { isInitialized } = useIsInitialized();
  const { isSignedIn } = useIsSignedIn();
  const { currentUser } = useCurrentUser();
  const { evmAddress } = useEvmAddress();
  const { signInWithEmail } = useSignInWithEmail();
  const { verifyEmailOTP } = useVerifyEmailOTP();
  const { signOut } = useSignOut();
  const { createEvmSmartAccount } = useCreateEvmSmartAccount();

  const ensureInitialized = useCallback(async () => {
    if (!cdpConfig?.projectId) {
      throw new Error('Missing CDP projectId in SwiftShoprProvider config');
    }
    await cdpInitialize({ projectId: cdpConfig.projectId });
  }, [cdpConfig?.projectId]);

  return {
    isInitialized,
    isSignedIn,
    currentUser,
    evmAddress,
    signInWithEmail,
    verifyEmailOTP,
    signOut,
    createEvmSmartAccount,
    ensureInitialized,
  };
};

export default useSwiftShoprWallet;
