import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { SwiftShoprClient } from 'swiftshopr-payments';

// Initialize SDK with your test API key
const client = new SwiftShoprClient({
  apiKey: 'sk_test_ross_2024', // Test key for ROSS chain
  environment: 'production',   // Points to your Render backend
});

// Demo store configuration
const DEMO_STORE = {
  id: 'ROSS001',
  name: 'Ross Dress for Less',
  chainId: 'ROSS',
};

export default function App() {
  const [screen, setScreen] = useState('cart'); // cart, lookup, payment, receipt
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [paymentIntent, setPaymentIntent] = useState(null);
  const [receipt, setReceipt] = useState(null);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;

  // Look up product by barcode
  const lookupProduct = async () => {
    if (!barcode.trim()) {
      Alert.alert('Error', 'Please enter a barcode');
      return;
    }

    setLoading(true);
    try {
      const result = await client.products.lookup(barcode.trim());

      if (result.success && result.product) {
        const product = result.product;

        // Check if already in cart
        const existingIndex = cart.findIndex(item => item.barcode === product.barcode);

        if (existingIndex >= 0) {
          // Increment quantity
          const newCart = [...cart];
          newCart[existingIndex].quantity += 1;
          setCart(newCart);
        } else {
          // Add new item
          setCart([...cart, {
            barcode: product.barcode,
            name: product.name,
            price: product.price,
            quantity: 1,
          }]);
        }

        setBarcode('');
        Alert.alert('Added', `${product.name} - $${product.price.toFixed(2)}`);
      } else {
        Alert.alert('Not Found', 'Product not found in database');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to lookup product');
    } finally {
      setLoading(false);
    }
  };

  // Create payment session (starts the onramp flow)
  const startPayment = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Add items to your cart first');
      return;
    }

    setLoading(true);
    try {
      // Create an onramp session via the SDK
      const session = await client.payments.createSession({
        storeId: DEMO_STORE.id,
        amount: total,
        orderId: `DEMO-${Date.now()}`,
        metadata: {
          demo: true,
          store_name: DEMO_STORE.name,
          items: cart.map(item => ({
            barcode: item.barcode,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      });

      // Store the session/intent for receipt creation later
      setPaymentIntent({
        id: session.intentId,
        sessionId: session.sessionId,
        orderId: session.orderId,
        onrampUrl: session.onrampUrl,
      });
      setScreen('payment');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create payment');
    } finally {
      setLoading(false);
    }
  };

  // Simulate payment completion and create receipt
  const completePayment = async () => {
    setLoading(true);
    try {
      // In real app, this would be triggered by blockchain confirmation
      // For demo, we create receipt directly
      const items = cart.map(item => ({
        barcode: item.barcode,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
      }));

      const receiptData = await client.receipts.create({
        intentId: paymentIntent.id,
        storeId: DEMO_STORE.id,
        items: items,
        subtotal: subtotal,
        tax: tax,
        total: total,
      });

      setReceipt(receiptData);
      setScreen('receipt');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create receipt');
    } finally {
      setLoading(false);
    }
  };

  // Reset for new transaction
  const newTransaction = () => {
    setCart([]);
    setPaymentIntent(null);
    setReceipt(null);
    setScreen('cart');
  };

  // Remove item from cart
  const removeItem = (barcode) => {
    setCart(cart.filter(item => item.barcode !== barcode));
  };

  // Render cart screen
  const renderCart = () => (
    <View style={styles.screenContainer}>
      <View style={styles.header}>
        <Text style={styles.storeName}>{DEMO_STORE.name}</Text>
        <Text style={styles.storeId}>Store: {DEMO_STORE.id}</Text>
      </View>

      {/* Barcode Input */}
      <View style={styles.lookupContainer}>
        <TextInput
          style={styles.barcodeInput}
          placeholder="Enter barcode..."
          value={barcode}
          onChangeText={setBarcode}
          keyboardType="numeric"
        />
        <TouchableOpacity
          style={styles.lookupButton}
          onPress={lookupProduct}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.lookupButtonText}>Add</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Quick Add Buttons (Demo barcodes) */}
      <View style={styles.quickAddContainer}>
        <Text style={styles.quickAddLabel}>Quick Add (Demo):</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['123456789012', '234567890123', '345678901234'].map(code => (
            <TouchableOpacity
              key={code}
              style={styles.quickAddButton}
              onPress={() => {
                setBarcode(code);
              }}
            >
              <Text style={styles.quickAddText}>{code.slice(-4)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Cart Items */}
      <View style={styles.cartContainer}>
        <Text style={styles.sectionTitle}>Cart ({cart.length} items)</Text>
        {cart.length === 0 ? (
          <Text style={styles.emptyCart}>Scan items to add to cart</Text>
        ) : (
          <FlatList
            data={cart}
            keyExtractor={(item) => item.barcode}
            renderItem={({ item }) => (
              <View style={styles.cartItem}>
                <View style={styles.cartItemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemBarcode}>{item.barcode}</Text>
                </View>
                <View style={styles.cartItemRight}>
                  <Text style={styles.itemQty}>x{item.quantity}</Text>
                  <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
                  <TouchableOpacity onPress={() => removeItem(item.barcode)}>
                    <Text style={styles.removeButton}>X</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </View>

      {/* Totals */}
      <View style={styles.totalsContainer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tax (8%)</Text>
          <Text style={styles.totalValue}>${tax.toFixed(2)}</Text>
        </View>
        <View style={[styles.totalRow, styles.grandTotal]}>
          <Text style={styles.grandTotalLabel}>Total</Text>
          <Text style={styles.grandTotalValue}>${total.toFixed(2)}</Text>
        </View>
      </View>

      {/* Pay Button */}
      <TouchableOpacity
        style={[styles.payButton, cart.length === 0 && styles.payButtonDisabled]}
        onPress={startPayment}
        disabled={cart.length === 0 || loading}
      >
        <Text style={styles.payButtonText}>
          Pay with SwiftShopr
        </Text>
        <Text style={styles.payButtonSubtext}>Powered by swiftshopr-payments</Text>
      </TouchableOpacity>
    </View>
  );

  // Render payment screen
  const renderPayment = () => (
    <View style={styles.screenContainer}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Payment</Text>
      </View>

      <View style={styles.paymentInfo}>
        <Text style={styles.paymentLabel}>Amount Due</Text>
        <Text style={styles.paymentAmount}>${total.toFixed(2)}</Text>

        <View style={styles.intentInfo}>
          <Text style={styles.intentLabel}>Payment Intent</Text>
          <Text style={styles.intentId}>{paymentIntent?.id?.slice(0, 8)}...</Text>
        </View>

        <Text style={styles.paymentInstructions}>
          In a real scenario, the customer would now pay via USDC.
          For this demo, tap "Simulate Payment" to complete.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.simulateButton}
        onPress={completePayment}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.simulateButtonText}>Simulate Payment Complete</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => setScreen('cart')}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  // Render receipt screen
  const renderReceipt = () => (
    <ScrollView style={styles.screenContainer}>
      <View style={styles.receiptContainer}>
        <View style={styles.receiptHeader}>
          <Text style={styles.receiptTitle}>E-Receipt</Text>
          <Text style={styles.receiptStore}>{DEMO_STORE.name}</Text>
        </View>

        {/* Verification Code - Large for employee */}
        <View style={styles.verificationBox}>
          <Text style={styles.verificationLabel}>VERIFICATION CODE</Text>
          <Text style={styles.verificationCode}>{receipt?.verificationCode}</Text>
          <Text style={styles.verificationHint}>Show this to store employee</Text>
        </View>

        {/* Receipt Details */}
        <View style={styles.receiptDetails}>
          <Text style={styles.receiptId}>Receipt: {receipt?.receiptId}</Text>
          <Text style={styles.receiptDate}>
            {new Date(receipt?.createdAt).toLocaleString()}
          </Text>
        </View>

        {/* Items */}
        <View style={styles.receiptItems}>
          <Text style={styles.receiptSectionTitle}>Items</Text>
          {receipt?.items?.map((item, index) => (
            <View key={index} style={styles.receiptItem}>
              <Text style={styles.receiptItemName}>
                {item.name} x{item.quantity}
              </Text>
              <Text style={styles.receiptItemPrice}>${item.total.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.receiptTotals}>
          <View style={styles.receiptTotalRow}>
            <Text>Subtotal</Text>
            <Text>${receipt?.subtotal?.toFixed(2)}</Text>
          </View>
          <View style={styles.receiptTotalRow}>
            <Text>Tax</Text>
            <Text>${receipt?.tax?.toFixed(2)}</Text>
          </View>
          <View style={[styles.receiptTotalRow, styles.receiptGrandTotal]}>
            <Text style={styles.receiptGrandTotalText}>Total</Text>
            <Text style={styles.receiptGrandTotalText}>${receipt?.total?.toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment Confirmation */}
        <View style={styles.paymentConfirmation}>
          <Text style={styles.paymentConfirmTitle}>Payment Confirmed</Text>
          {receipt?.payment?.txHash && (
            <Text style={styles.txHash}>
              TX: {receipt.payment.txHash.slice(0, 10)}...
            </Text>
          )}
        </View>

        {/* New Transaction Button */}
        <TouchableOpacity
          style={styles.newTransactionButton}
          onPress={newTransaction}
        >
          <Text style={styles.newTransactionText}>New Transaction</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      {screen === 'cart' && renderCart()}
      {screen === 'payment' && renderPayment()}
      {screen === 'receipt' && renderReceipt()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  screenContainer: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  storeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  storeId: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },

  // Lookup
  lookupContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  barcodeInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  lookupButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 20,
    marginLeft: 8,
    justifyContent: 'center',
  },
  lookupButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  // Quick Add
  quickAddContainer: {
    marginBottom: 16,
  },
  quickAddLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  quickAddButton: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  quickAddText: {
    fontSize: 12,
    color: '#333',
  },

  // Cart
  cartContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  emptyCart: {
    textAlign: 'center',
    color: '#999',
    paddingVertical: 40,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cartItemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  itemBarcode: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  cartItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemQty: {
    fontSize: 14,
    color: '#666',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    minWidth: 60,
    textAlign: 'right',
  },
  removeButton: {
    color: '#ff3b30',
    fontWeight: 'bold',
    fontSize: 16,
    paddingHorizontal: 8,
  },

  // Totals
  totalsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    color: '#666',
  },
  totalValue: {
    color: '#333',
  },
  grandTotal: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#333',
  },
  grandTotalValue: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#333',
  },

  // Pay Button
  payButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  payButtonDisabled: {
    backgroundColor: '#ccc',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  payButtonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 4,
  },

  // Payment Screen
  paymentInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666',
  },
  paymentAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 16,
  },
  intentInfo: {
    marginTop: 16,
    alignItems: 'center',
  },
  intentLabel: {
    fontSize: 12,
    color: '#999',
  },
  intentId: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
  paymentInstructions: {
    marginTop: 24,
    textAlign: 'center',
    color: '#666',
    lineHeight: 20,
  },
  simulateButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  simulateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ff3b30',
    fontSize: 16,
  },

  // Receipt Screen
  receiptContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  receiptTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  receiptStore: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  verificationBox: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  verificationLabel: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  verificationCode: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#007AFF',
    letterSpacing: 4,
    marginVertical: 8,
  },
  verificationHint: {
    fontSize: 12,
    color: '#666',
  },
  receiptDetails: {
    alignItems: 'center',
    marginBottom: 16,
  },
  receiptId: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  receiptDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  receiptItems: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  receiptSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  receiptItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  receiptItemName: {
    color: '#333',
  },
  receiptItemPrice: {
    color: '#333',
    fontWeight: '500',
  },
  receiptTotals: {
    marginBottom: 16,
  },
  receiptTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  receiptGrandTotal: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
    marginTop: 4,
  },
  receiptGrandTotalText: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  paymentConfirmation: {
    backgroundColor: '#d4edda',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  paymentConfirmTitle: {
    color: '#155724',
    fontWeight: 'bold',
    fontSize: 16,
  },
  txHash: {
    color: '#155724',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'monospace',
  },
  newTransactionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  newTransactionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
