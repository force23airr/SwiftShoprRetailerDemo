// @swiftshopr/sdk/src/components/PayWithUSDC.jsx
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { usePayment } from '../hooks/usePayment';
import { useSwiftShoprWallet } from '../hooks/useSwiftShoprWallet';
import { useSwiftShoprConfig } from './SwiftShoprProvider';
import OnrampModal from './OnrampModal';
import { openOnramp } from '../core/onramp';

const statusLabelMap = {
  idle: 'Pay with USDC',
  sending: 'Sending',
  confirming: 'Confirming',
  success: 'Paid',
  awaiting_funds: 'Add USDC',
  error: 'Try again',
};

const PayWithUSDC = ({
  amountUsd,
  storeId,
  orderId,
  destinationAddress,
  walletAddress,
  label,
  disabled,
  onSuccess,
  onError,
  onRequestSignIn,
  onOpenOnramp,
  requireBalance = true,
  style,
  buttonStyle,
  textStyle,
}) => {
  const { onrampUrl, apiBaseUrl, apiKey, onrampRoute, paymentCurrency, paymentMethod } = useSwiftShoprConfig();

  // Validate storeId is provided
  if (!storeId) {
    console.warn('PayWithUSDC: storeId is required for payment tracking');
  }
  const { evmAddress } = useSwiftShoprWallet();
  const resolvedWallet = walletAddress || evmAddress;
  const [showOnramp, setShowOnramp] = useState(false);
  const { status, error, startPayment, reset } = usePayment();

  const isBusy = status === 'sending' || status === 'confirming';

  const buttonLabel = useMemo(() => {
    if (label) return label;
    return statusLabelMap[status] || statusLabelMap.idle;
  }, [label, status]);

  const handlePress = async () => {
    if (status === 'success') {
      reset();
      return;
    }

    if (!resolvedWallet) {
      onRequestSignIn?.();
      return;
    }

    const result = await startPayment({
      amountUsd,
      storeId,
      orderId,
      destinationAddress,
      userWalletAddress: resolvedWallet,
      requireBalance,
    });

    if (!result.success) {
      if (result.reason === 'insufficient_funds') {
        setShowOnramp(true);
      }
      onError?.(result);
      return;
    }

    onSuccess?.(result);
  };

  const resolvedOnrampHandler = useMemo(() => {
    if (onOpenOnramp) {
      return onOpenOnramp;
    }
    if (onrampUrl) {
      return undefined;
    }
    return async () => {
      await openOnramp({
        amountUsd,
        walletAddress: resolvedWallet,
        storeId,
        orderId,
        apiBaseUrl,
        apiKey,
        paymentCurrency,
        paymentMethod,
        onrampRoute,
      });
    };
  }, [
    onOpenOnramp,
    onrampUrl,
    amountUsd,
    resolvedWallet,
    storeId,
    orderId,
    apiBaseUrl,
    apiKey,
    paymentCurrency,
    paymentMethod,
    onrampRoute,
  ]);

  return (
    <View style={style}>
      <Pressable
        style={[styles.button, buttonStyle, (disabled || isBusy) && styles.buttonDisabled]}
        onPress={handlePress}
        disabled={disabled || isBusy}
      >
        {isBusy ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={[styles.buttonText, textStyle]}>{buttonLabel}</Text>
        )}
      </Pressable>
      {status === 'error' && error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
      <OnrampModal
        visible={showOnramp}
        amountUsd={amountUsd}
        onClose={() => setShowOnramp(false)}
        onOpenOnramp={resolvedOnrampHandler}
        onrampUrl={onrampUrl}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#111827',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  errorText: {
    marginTop: 8,
    color: '#b91c1c',
    fontSize: 12,
  },
});

export default PayWithUSDC;
