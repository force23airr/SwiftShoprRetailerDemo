
// @swiftshopr/sdk/src/components/OnrampModal.jsx
import React from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

const OnrampModal = ({
  visible,
  amountUsd,
  onClose,
  onOpenOnramp,
  onrampUrl,
}) => {
  const handleOpen = async () => {
    if (onOpenOnramp) {
      onOpenOnramp();
      return;
    }
    if (onrampUrl) {
      await Linking.openURL(onrampUrl);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Add USDC</Text>
          <Text style={styles.subtitle}>
            You need more USDC to complete this payment.
          </Text>
          {amountUsd ? (
            <Text style={styles.amount}>Need: ${Number(amountUsd).toFixed(2)}</Text>
          ) : null}
          <View style={styles.actions}>
            <Pressable style={styles.secondary} onPress={onClose}>
              <Text style={styles.secondaryText}>Not now</Text>
            </Pressable>
            <Pressable style={styles.primary} onPress={handleOpen}>
              <Text style={styles.primaryText}>Add funds</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 12,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  primary: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondary: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  secondaryText: {
    color: '#111827',
    fontWeight: '600',
  },
});

export default OnrampModal;
