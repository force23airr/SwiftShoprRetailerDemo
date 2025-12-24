/**
 * SwiftShopr Retailer Demo App
 *
 * This demo shows how a retailer integrates the @swiftshopr/sdk
 * into their mobile app for Scan & Go checkout with USDC payments.
 *
 * The retailer only needs to:
 * 1. Wrap their app in SwiftShoprProvider with their config
 * 2. Drop in ScanAndGoScreen (or individual components)
 * 3. Handle the onComplete callback
 */

import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';

// Import from the SwiftShopr SDK
import { SwiftShoprProvider } from './@swiftshopr/sdk/src/components/SwiftShoprProvider';
import ScanAndGoScreen from './@swiftshopr/sdk/src/components/ScanAndGoScreen';

// ============================================
// RETAILER CONFIGURATION
// ============================================
// In production, these would come from the retailer's environment
const RETAILER_CONFIG = {
  // CDP Project ID from Coinbase Developer Platform
  projectId: '2845a1fd-f272-448b-8d4e-386f1906dfbd',

  // SwiftShopr Backend API
  apiBaseUrl: 'https://shopr-scanner-backend.onrender.com',
  apiKey: 'sk_test_ross_2024', // Retailer's API key

  // Network configuration
  network: 'base', // 'base' for mainnet, 'base-sepolia' for testnet

  // App name for wallet
  appName: 'Target Demo',
};

// Demo store info
const DEMO_STORE = {
  id: 'TARGET001',
  name: 'Target - Demo Store',
  primaryColor: '#CC0000', // Target red
};

// ============================================
// MAIN APP
// ============================================
export default function App() {
  const [showCheckout, setShowCheckout] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);

  // Handle successful checkout
  const handleCheckoutComplete = (result) => {
    console.log('Checkout complete:', result);

    setLastReceipt({
      orderId: result.orderId,
      txHash: result.txHash,
      total: result.total,
      itemCount: result.items?.length || 0,
      receiptId: result.receipt?.receiptId,
    });

    setShowCheckout(false);

    Alert.alert(
      'Order Complete!',
      `Transaction: ${result.txHash?.slice(0, 10)}...\nTotal: $${result.total?.toFixed(2)}`,
      [{ text: 'OK' }]
    );
  };

  // Handle checkout cancellation
  const handleCheckoutCancel = () => {
    setShowCheckout(false);
  };

  // Show the checkout screen (ScanAndGoScreen)
  if (showCheckout) {
    return (
      <SwiftShoprProvider config={RETAILER_CONFIG}>
        <ScanAndGoScreen
          storeId={DEMO_STORE.id}
          storeName={DEMO_STORE.name}
          primaryColor={DEMO_STORE.primaryColor}
          onComplete={handleCheckoutComplete}
          onCancel={handleCheckoutCancel}
        />
      </SwiftShoprProvider>
    );
  }

  // Home screen - Retailer's landing page
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.storeName}>{DEMO_STORE.name}</Text>
        <Text style={styles.storeId}>Store ID: {DEMO_STORE.id}</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.heroSection}>
          <Text style={styles.heroIcon}>🛒</Text>
          <Text style={styles.heroTitle}>Scan & Go</Text>
          <Text style={styles.heroSubtitle}>
            Skip the checkout line. Scan items with your phone and pay instantly with USDC.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📷</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Scan Products</Text>
              <Text style={styles.featureDesc}>Use your camera to scan barcodes</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>💳</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Pay with USDC</Text>
              <Text style={styles.featureDesc}>Fast, secure crypto payments</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🧾</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Digital Receipt</Text>
              <Text style={styles.featureDesc}>Show to employee on exit</Text>
            </View>
          </View>
        </View>

        {/* Last Receipt (if any) */}
        {lastReceipt && (
          <View style={styles.lastReceipt}>
            <Text style={styles.lastReceiptTitle}>Last Transaction</Text>
            <Text style={styles.lastReceiptDetail}>
              {lastReceipt.itemCount} items • ${lastReceipt.total?.toFixed(2)}
            </Text>
            <Text style={styles.lastReceiptId}>
              Receipt: {lastReceipt.receiptId || 'N/A'}
            </Text>
          </View>
        )}
      </View>

      {/* Start Shopping Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: DEMO_STORE.primaryColor }]}
          onPress={() => setShowCheckout(true)}
        >
          <Text style={styles.startButtonText}>Start Shopping</Text>
        </TouchableOpacity>

        <Text style={styles.poweredBy}>
          Powered by SwiftShopr
        </Text>
      </View>
    </SafeAreaView>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    paddingTop: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  storeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  storeId: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  heroIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  features: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  featureIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  featureDesc: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  lastReceipt: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  lastReceiptTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
  },
  lastReceiptDetail: {
    fontSize: 16,
    color: '#047857',
    marginTop: 4,
  },
  lastReceiptId: {
    fontSize: 12,
    color: '#6EE7B7',
    marginTop: 4,
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  startButton: {
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  poweredBy: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 12,
    color: '#9CA3AF',
  },
});
