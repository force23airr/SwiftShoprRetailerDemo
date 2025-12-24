// @swiftshopr/sdk/src/components/ScanAndGoScreen.jsx
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  SafeAreaView,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';
import BarcodeScanner from './BarcodeScanner';
import CartProvider from './CartProvider';
import PayWithUSDC from './PayWithUSDC';
import { useCart } from '../hooks/useCart';
import { useSwiftShoprConfig } from './SwiftShoprProvider';
import { lookupProduct } from '../core/products';
import { generateReceipt } from '../core/receipts';

/**
 * CartItemRow - Individual cart item display
 */
const CartItemRow = ({ item, onIncrement, onDecrement, onRemove, primaryColor }) => {
  return (
    <View style={styles.cartItem}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.itemImage} />
      ) : (
        <View style={[styles.itemImagePlaceholder, { backgroundColor: primaryColor + '20' }]}>
          <Text style={styles.itemImagePlaceholderText}>📦</Text>
        </View>
      )}
      <View style={styles.itemDetails}>
        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
      </View>
      <View style={styles.quantityControls}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => onDecrement(item.barcode)}
        >
          <Text style={styles.quantityButtonText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.quantityText}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => onIncrement(item.barcode)}
        >
          <Text style={styles.quantityButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * ReceiptItem - Simplified item row for receipt display
 */
const ReceiptItem = ({ item }) => {
  const lineTotal = (item.price * item.quantity).toFixed(2);
  return (
    <View style={styles.receiptItem}>
      <View style={styles.receiptItemLeft}>
        <Text style={styles.receiptItemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.receiptItemMeta}>
          {item.quantity > 1 ? `${item.quantity} × $${item.price.toFixed(2)}` : ''}
        </Text>
      </View>
      <Text style={styles.receiptItemPrice}>${lineTotal}</Text>
    </View>
  );
};

/**
 * Format timestamp for receipt display
 */
const formatReceiptTime = (date) => {
  const now = new Date();
  const receiptDate = new Date(date);

  const timeStr = receiptDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const dateStr = receiptDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return { timeStr, dateStr };
};

/**
 * ReceiptScreen - Visual verification receipt display
 *
 * SECURITY: Screenshots are blocked to prevent receipt fraud.
 * - iOS: Screen appears black in screenshots
 * - Android: FLAG_SECURE prevents screenshots entirely
 */
const ReceiptScreen = ({
  receiptData,
  storeName,
  primaryColor,
  onDone,
}) => {
  const { timeStr, dateStr } = formatReceiptTime(receiptData.timestamp || new Date());
  const [screenshotAttempted, setScreenshotAttempted] = useState(false);

  // Generate a short verification code from receipt ID
  const verificationCode = receiptData.receiptId
    ? receiptData.receiptId.replace('RCP_', '').substring(0, 8).toUpperCase()
    : Math.random().toString(36).substring(2, 10).toUpperCase();

  // Prevent screenshots while receipt is displayed
  useEffect(() => {
    let subscription = null;

    const activateScreenProtection = async () => {
      try {
        // Prevent screen capture (works on iOS and Android)
        await ScreenCapture.preventScreenCaptureAsync();

        // Listen for screenshot attempts (iOS primarily)
        subscription = ScreenCapture.addScreenshotListener(() => {
          setScreenshotAttempted(true);
          Alert.alert(
            'Screenshot Blocked',
            'For security, receipts cannot be screenshotted. Please show this screen directly to a store employee.',
            [{ text: 'OK', onPress: () => setScreenshotAttempted(false) }]
          );
        });
      } catch (error) {
        // Screen capture prevention not available on this device
        console.warn('Screen capture prevention not available:', error.message);
      }
    };

    activateScreenProtection();

    // Cleanup: Allow screen capture again when leaving receipt screen
    return () => {
      ScreenCapture.allowScreenCaptureAsync().catch(() => {});
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  return (
    <SafeAreaView style={styles.receiptContainer}>
      <ScrollView
        style={styles.receiptScrollView}
        contentContainerStyle={styles.receiptScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Header */}
        <View style={styles.receiptHeader}>
          <View style={[styles.successBadge, { backgroundColor: primaryColor }]}>
            <Text style={styles.successIcon}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Payment Complete</Text>
          <Text style={styles.successSubtitle}>
            Show this receipt to any employee
          </Text>
        </View>

        {/* Verification Code - Big and readable */}
        <View style={styles.verificationSection}>
          <Text style={styles.verificationLabel}>VERIFICATION CODE</Text>
          <Text style={[styles.verificationCode, { color: primaryColor }]}>
            {verificationCode}
          </Text>
          <View style={styles.timestampRow}>
            <Text style={styles.timestampText}>{dateStr}</Text>
            <Text style={styles.timestampDot}>•</Text>
            <Text style={styles.timestampText}>{timeStr}</Text>
          </View>
        </View>

        {/* Store Info */}
        {storeName && (
          <View style={styles.storeSection}>
            <Text style={styles.storeIcon}>📍</Text>
            <Text style={styles.storeName}>{storeName}</Text>
          </View>
        )}

        {/* Divider */}
        <View style={styles.receiptDivider}>
          <View style={styles.receiptDividerLine} />
          <Text style={styles.receiptDividerText}>ITEMS PURCHASED</Text>
          <View style={styles.receiptDividerLine} />
        </View>

        {/* Items List */}
        <View style={styles.receiptItemsList}>
          {receiptData.items.map((item, index) => (
            <ReceiptItem key={item.barcode || index} item={item} />
          ))}
        </View>

        {/* Total */}
        <View style={styles.receiptTotalSection}>
          <View style={styles.receiptTotalRow}>
            <Text style={styles.receiptTotalLabel}>Total Paid</Text>
            <Text style={[styles.receiptTotalAmount, { color: primaryColor }]}>
              ${receiptData.total.toFixed(2)}
            </Text>
          </View>
          <Text style={styles.paymentMethod}>Paid with USDC</Text>
        </View>

        {/* Verification Instructions */}
        <View style={styles.instructionsSection}>
          <Text style={styles.instructionsTitle}>How to Verify</Text>
          <View style={styles.instructionRow}>
            <Text style={styles.instructionNumber}>1</Text>
            <Text style={styles.instructionText}>
              Show this screen to any store employee
            </Text>
          </View>
          <View style={styles.instructionRow}>
            <Text style={styles.instructionNumber}>2</Text>
            <Text style={styles.instructionText}>
              Employee confirms the verification code and timestamp
            </Text>
          </View>
          <View style={styles.instructionRow}>
            <Text style={styles.instructionNumber}>3</Text>
            <Text style={styles.instructionText}>
              You're good to go!
            </Text>
          </View>
        </View>

        {/* Receipt ID (small, for reference) */}
        {receiptData.receiptId && (
          <Text style={styles.receiptIdText}>
            Receipt: {receiptData.receiptId}
          </Text>
        )}

        {/* Security notice */}
        <View style={styles.securityNotice}>
          <Text style={styles.securityIcon}>🔒</Text>
          <Text style={styles.securityText}>
            Screenshot protected for your security
          </Text>
        </View>
      </ScrollView>

      {/* Done Button */}
      <View style={styles.receiptFooter}>
        <TouchableOpacity
          style={[styles.doneButton, { backgroundColor: primaryColor }]}
          onPress={onDone}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

/**
 * ScanAndGoContent - Inner content (requires CartProvider parent)
 */
const ScanAndGoContent = ({
  storeId,
  orderId,
  onComplete,
  onCancel,
  primaryColor = '#22C55E',
  storeName,
  showScanner = true,
}) => {
  const config = useSwiftShoprConfig();
  const {
    items,
    total,
    itemCount,
    isEmpty,
    addItem,
    increment,
    decrement,
    removeItem,
    clear,
  } = useCart();

  const [mode, setMode] = useState('scan'); // 'scan' | 'cart' | 'checkout' | 'receipt'
  const [isLoading, setIsLoading] = useState(false);
  const [lastScannedItem, setLastScannedItem] = useState(null);
  const [showAddedMessage, setShowAddedMessage] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  const handleScan = useCallback(
    async (barcode) => {
      setIsLoading(true);

      try {
        const product = await lookupProduct({
          barcode,
          storeId,
          apiBaseUrl: config.apiBaseUrl,
          apiKey: config.apiKey,
        });

        if (!product) {
          Alert.alert(
            'Product Not Found',
            `Barcode: ${barcode}\n\nThis product is not in our system.`,
            [{ text: 'OK' }]
          );
          return;
        }

        if (product.inStock === false) {
          Alert.alert(
            'Out of Stock',
            `${product.name}\n\nCurrently unavailable.`,
            [{ text: 'OK' }]
          );
          return;
        }

        const added = addItem(product);

        if (added) {
          setLastScannedItem(product);
          setShowAddedMessage(true);
          setTimeout(() => setShowAddedMessage(false), 2000);
        } else {
          // Item already in cart - increment
          increment(barcode);
          setLastScannedItem(product);
          setShowAddedMessage(true);
          setTimeout(() => setShowAddedMessage(false), 2000);
        }
      } catch (error) {
        Alert.alert(
          'Scan Error',
          error.message || 'Unable to look up product. Please try again.',
          [{ text: 'OK' }]
        );
      } finally {
        setIsLoading(false);
      }
    },
    [storeId, config.apiBaseUrl, config.apiKey, addItem, increment]
  );

  const handlePaymentSuccess = useCallback(
    async (result) => {
      // Generate receipt for exit verification
      let receipt = null;
      try {
        receipt = await generateReceipt({
          intentId: result.intentId,
          storeId,
          items,
          total,
          orderId: result.orderId || orderId,
          apiBaseUrl: config.apiBaseUrl,
          apiKey: config.apiKey,
        });
      } catch (error) {
        // Receipt generation failed but payment succeeded
        console.warn('Receipt generation failed:', error.message);
      }

      // Store receipt data for display (keep items before clearing cart)
      const cartItems = [...items];
      const receiptDisplayData = {
        receiptId: receipt?.receiptId || null,
        qrData: receipt?.qrData || null,
        qrUrl: receipt?.qrUrl || null,
        items: cartItems,
        total,
        orderId: result.orderId || orderId,
        intentId: result.intentId,
        txHash: result.txHash,
        timestamp: new Date().toISOString(),
      };

      setReceiptData(receiptDisplayData);
      clear();
      setMode('receipt'); // Show receipt screen for visual verification
    },
    [clear, orderId, items, total, storeId, config.apiBaseUrl, config.apiKey]
  );

  // Called when user taps "Done" on receipt screen
  const handleReceiptDone = useCallback(() => {
    if (receiptData) {
      onComplete?.({
        success: true,
        orderId: receiptData.orderId,
        intentId: receiptData.intentId,
        txHash: receiptData.txHash,
        items: receiptData.items,
        total: receiptData.total,
        receipt: receiptData.receiptId ? {
          receiptId: receiptData.receiptId,
          qrData: receiptData.qrData,
          qrUrl: receiptData.qrUrl,
        } : null,
      });
    }
    setReceiptData(null);
  }, [receiptData, onComplete]);

  const handlePaymentError = useCallback(
    (result) => {
      Alert.alert(
        'Payment Failed',
        result.error || 'Unable to complete payment. Please try again.',
        [{ text: 'OK' }]
      );
    },
    []
  );

  const handleCancel = useCallback(() => {
    if (!isEmpty) {
      Alert.alert(
        'Leave Checkout?',
        'Your cart will be cleared.',
        [
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: () => {
              clear();
              onCancel?.();
            },
          },
        ]
      );
    } else {
      onCancel?.();
    }
  }, [isEmpty, clear, onCancel]);

  // Render receipt screen (after successful payment)
  if (mode === 'receipt' && receiptData) {
    return (
      <ReceiptScreen
        receiptData={receiptData}
        storeName={storeName}
        primaryColor={primaryColor}
        onDone={handleReceiptDone}
      />
    );
  }

  // Render scanner view
  if (mode === 'scan' && showScanner) {
    return (
      <View style={styles.container}>
        <BarcodeScanner
          onScan={handleScan}
          enabled={!isLoading}
          primaryColor={primaryColor}
          instructionText={isLoading ? 'Looking up product...' : 'Scan product barcode'}
        />

        {/* Added to cart message */}
        {showAddedMessage && lastScannedItem && (
          <Animated.View style={styles.addedMessage}>
            <Text style={styles.addedMessageIcon}>✓</Text>
            <View style={styles.addedMessageContent}>
              <Text style={styles.addedMessageTitle}>Added to Cart</Text>
              <Text style={styles.addedMessageName} numberOfLines={1}>
                {lastScannedItem.name}
              </Text>
              <Text style={styles.addedMessagePrice}>
                ${lastScannedItem.price.toFixed(2)}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Bottom bar with cart summary */}
        <View style={styles.bottomBar}>
          <View style={styles.bottomBarLeft}>
            {storeName && (
              <Text style={styles.storeNameText}>📍 {storeName}</Text>
            )}
            <Text style={styles.cartSummaryText}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'} • ${total.toFixed(2)}
            </Text>
          </View>

          <View style={styles.bottomBarRight}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>✕</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.viewCartButton,
                { backgroundColor: primaryColor },
                isEmpty && styles.buttonDisabled,
              ]}
              onPress={() => setMode('cart')}
              disabled={isEmpty}
            >
              <Text style={styles.viewCartButtonText}>
                View Cart ({itemCount})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Render cart view
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMode('scan')} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Scan</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Cart</Text>
        <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      {isEmpty ? (
        <View style={styles.emptyCart}>
          <Text style={styles.emptyCartIcon}>🛒</Text>
          <Text style={styles.emptyCartText}>Your cart is empty</Text>
          <TouchableOpacity
            style={[styles.startScanningButton, { backgroundColor: primaryColor }]}
            onPress={() => setMode('scan')}
          >
            <Text style={styles.startScanningButtonText}>Start Scanning</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView style={styles.cartList}>
            {items.map((item) => (
              <CartItemRow
                key={item.barcode}
                item={item}
                onIncrement={increment}
                onDecrement={decrement}
                onRemove={removeItem}
                primaryColor={primaryColor}
              />
            ))}
          </ScrollView>

          <View style={styles.checkoutSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
            </View>

            <PayWithUSDC
              amountUsd={total}
              storeId={storeId}
              orderId={orderId}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              buttonStyle={[styles.payButton, { backgroundColor: primaryColor }]}
              textStyle={styles.payButtonText}
            />

            <TouchableOpacity
              style={styles.continueScanning}
              onPress={() => setMode('scan')}
            >
              <Text style={[styles.continueScanningText, { color: primaryColor }]}>
                + Add More Items
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

/**
 * ScanAndGoScreen - Full scan-and-go checkout experience.
 *
 * Drop this component into a retailer's app to give their customers
 * the complete SwiftShopr scan-and-pay experience.
 *
 * @param {Object} props
 * @param {string} props.storeId - Required. Retailer store ID
 * @param {string} [props.orderId] - Optional. Retailer order ID for correlation
 * @param {Function} props.onComplete - Callback when checkout completes
 * @param {Function} [props.onCancel] - Callback when user cancels
 * @param {string} [props.primaryColor='#22C55E'] - Primary accent color
 * @param {string} [props.storeName] - Store name to display
 *
 * @example
 * <ScanAndGoScreen
 *   storeId="STORE001"
 *   storeName="Target - Miami"
 *   primaryColor="#CC0000"
 *   onComplete={(result) => {
 *     console.log('Order complete:', result.orderId, result.txHash);
 *     navigation.navigate('Receipt', { orderId: result.orderId });
 *   }}
 *   onCancel={() => navigation.goBack()}
 * />
 */
const ScanAndGoScreen = (props) => {
  const { storeId, ...rest } = props;

  if (!storeId) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>storeId is required</Text>
      </View>
    );
  }

  return (
    <CartProvider storeId={storeId}>
      <ScanAndGoContent storeId={storeId} {...rest} />
    </CartProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 16,
  },
  // Added message overlay
  addedMessage: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(34, 197, 94, 0.95)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addedMessageIcon: {
    fontSize: 28,
    color: '#fff',
    marginRight: 12,
  },
  addedMessageContent: {
    flex: 1,
  },
  addedMessageTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addedMessageName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  addedMessagePrice: {
    color: '#fff',
    fontSize: 14,
    marginTop: 2,
  },
  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomBarLeft: {
    flex: 1,
  },
  storeNameText: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
  },
  cartSummaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  viewCartButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  viewCartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#111827',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#6B7280',
    fontSize: 20,
  },
  // Empty cart
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 40,
  },
  emptyCartIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyCartText: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 24,
  },
  startScanningButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  startScanningButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Cart list
  cartList: {
    flex: 1,
    backgroundColor: '#fff',
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  itemImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImagePlaceholderText: {
    fontSize: 24,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  itemPrice: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 20,
    color: '#111827',
    fontWeight: '600',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginHorizontal: 12,
    minWidth: 24,
    textAlign: 'center',
  },
  // Checkout section
  checkoutSection: {
    backgroundColor: '#fff',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  payButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  continueScanning: {
    marginTop: 12,
    alignItems: 'center',
  },
  continueScanningText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // ============================================
  // RECEIPT SCREEN STYLES
  // ============================================
  receiptContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  receiptScrollView: {
    flex: 1,
  },
  receiptScrollContent: {
    paddingBottom: 100,
  },
  receiptHeader: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 24,
    backgroundColor: '#fff',
  },
  successBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  successIcon: {
    fontSize: 40,
    color: '#fff',
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  // Verification code section
  verificationSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#fff',
    marginTop: 2,
  },
  verificationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  verificationCode: {
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  timestampText: {
    fontSize: 14,
    color: '#6B7280',
  },
  timestampDot: {
    fontSize: 14,
    color: '#D1D5DB',
    marginHorizontal: 8,
  },
  // Store section
  storeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginTop: 2,
  },
  storeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  // Divider
  receiptDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  receiptDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  receiptDividerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 1,
    marginHorizontal: 12,
  },
  // Items list
  receiptItemsList: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  receiptItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  receiptItemLeft: {
    flex: 1,
    marginRight: 16,
  },
  receiptItemName: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  receiptItemMeta: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  receiptItemPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  // Total section
  receiptTotalSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
  },
  receiptTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptTotalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  receiptTotalAmount: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  paymentMethod: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'right',
  },
  // Instructions section
  instructionsSection: {
    marginTop: 20,
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  // Receipt ID
  receiptIdText: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  // Security notice
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 10,
  },
  securityIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  securityText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  // Footer with Done button
  receiptFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  doneButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ScanAndGoScreen;
