
// @swiftshopr/sdk/src/hooks/usePayment.js
import { useCallback, useMemo, useReducer } from 'react';
import { getUSDCBalance } from '../core/balance';
import { transferUSDC, waitForConfirmation, createTransferIntent } from '../core/transfer';
import { useSwiftShoprConfig } from '../components/SwiftShoprProvider';

const initialState = {
  status: 'idle',
  error: null,
  txHash: null,
  intentId: null,
  lastResult: null,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'RESET':
      return { ...initialState };
    case 'START':
      return { ...state, status: 'sending', error: null, txHash: null, intentId: null };
    case 'INTENT_CREATED':
      return { ...state, intentId: action.intentId, lastResult: action.result };
    case 'INSUFFICIENT_FUNDS':
      return { ...state, status: 'awaiting_funds', error: action.error, lastResult: action.result };
    case 'SENT':
      return { ...state, status: 'confirming', txHash: action.txHash, lastResult: action.result };
    case 'SUCCESS':
      return { ...state, status: 'success', lastResult: action.result };
    case 'ERROR':
      return { ...state, status: 'error', error: action.error, lastResult: action.result };
    default:
      return state;
  }
};

export const usePayment = () => {
  const config = useSwiftShoprConfig();
  const [state, dispatch] = useReducer(reducer, initialState);

  const startPayment = useCallback(
    async ({
      amountUsd,
      storeId,
      orderId,
      destinationAddress,
      userWalletAddress,
      requireBalance = true,
      onStatus,
    }) => {
      dispatch({ type: 'START' });
      onStatus?.('sending');

      try {
        // Validate required params
        if (!storeId) {
          throw new Error('storeId is required for payment tracking');
        }

        // 1. Check balance first (if required)
        if (requireBalance) {
          const balanceResult = await getUSDCBalance(userWalletAddress, {
            network: config.network,
            rpcEndpoints: config.rpcEndpoints,
          });

          if (!balanceResult.success || balanceResult.balance < amountUsd) {
            const error = 'Insufficient USDC balance';
            dispatch({ type: 'INSUFFICIENT_FUNDS', error, result: balanceResult });
            onStatus?.('awaiting_funds');
            return { success: false, reason: 'insufficient_funds', ...balanceResult };
          }
        }

        // 2. Create transfer intent on backend BEFORE executing transfer
        // This enables payment tracking, webhook dispatch, and audit trail
        const intentResult = await createTransferIntent({
          storeId,
          amount: amountUsd,
          userWalletAddress,
          orderId,
          destinationAddress,
          apiBaseUrl: config.apiBaseUrl,
          apiKey: config.apiKey,
        });

        if (!intentResult.success) {
          dispatch({ type: 'ERROR', error: intentResult.error || 'Failed to create payment intent', result: intentResult });
          onStatus?.('error');
          return intentResult;
        }

        dispatch({ type: 'INTENT_CREATED', intentId: intentResult.intentId, result: intentResult });

        // 3. Execute transfer using params from backend
        // Backend provides the destination address (looked up by storeId)
        const transferResult = await transferUSDC(
          intentResult.transfer.to,
          Number(intentResult.transfer.amount),
          userWalletAddress,
          { network: config.network }
        );

        if (!transferResult.success) {
          dispatch({ type: 'ERROR', error: transferResult.error, result: transferResult });
          onStatus?.('error');
          return { ...transferResult, intentId: intentResult.intentId };
        }

        dispatch({ type: 'SENT', txHash: transferResult.txHash, result: transferResult });
        onStatus?.('confirming');

        // 4. Wait for confirmation (CDP webhook will also catch this)
        const confirmation = await waitForConfirmation(transferResult.txHash);
        if (!confirmation.confirmed) {
          const error = confirmation.error || 'Transaction not confirmed';
          dispatch({ type: 'ERROR', error, result: confirmation });
          onStatus?.('error');
          return { success: false, error, intentId: intentResult.intentId };
        }

        dispatch({ type: 'SUCCESS', result: transferResult });
        onStatus?.('success');

        return {
          success: true,
          intentId: intentResult.intentId,
          orderId: intentResult.orderId,
          ...transferResult,
        };
      } catch (error) {
        const message = error?.message || 'Payment failed';
        dispatch({ type: 'ERROR', error: message, result: null });
        onStatus?.('error');
        return { success: false, error: message };
      }
    },
    [config.network, config.rpcEndpoints, config.apiBaseUrl, config.apiKey]
  );

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const value = useMemo(() => ({
    ...state,
    startPayment,
    reset,
  }), [state, startPayment, reset]);

  return value;
};

export default usePayment;
