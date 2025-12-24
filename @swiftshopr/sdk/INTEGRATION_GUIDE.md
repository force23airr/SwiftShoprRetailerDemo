# @swiftshopr/sdk Integration Guide

> White-label USDC payments and Scan & Go checkout for retail apps.

---

## Overview

The SwiftShopr SDK allows retailers to embed a complete Scan & Go checkout experience into their existing mobile apps. Customers scan products with their phone, pay with USDC, and show a digital receipt to any employee for verification.

**Key Benefits:**
- 70%+ reduction in payment processing fees (0.3% vs 2.5-3.5% credit cards)
- Instant settlement (no 2-3 day wait)
- No chargebacks
- Complete checkout experience in ~30 lines of code

---

## Quick Start

### Step 1: Install the SDK

```bash
npm install @swiftshopr/sdk
```

**Peer Dependencies:**
```bash
npm install expo-camera expo-screen-capture
```

### Step 2: Wrap Your App with the Provider

```jsx
// App.js
import { SwiftShoprProvider } from '@swiftshopr/sdk';

export default function App() {
  return (
    <SwiftShoprProvider
      apiKey="pk_live_your_api_key"        // Provided by SwiftShopr
      apiBaseUrl="https://api.swiftshopr.com"
      storeId="YOUR_STORE_ID"              // Your store identifier
    >
      <YourApp />
    </SwiftShoprProvider>
  );
}
```

### Step 3: Add a Button to Launch Scan & Go

```jsx
// In your home screen or menu
<TouchableOpacity onPress={() => navigation.navigate('ScanAndGo')}>
  <Text>Scan & Pay</Text>
</TouchableOpacity>
```

### Step 4: Create the Scan & Go Screen

```jsx
// screens/ScanAndGoScreen.js
import { ScanAndGoScreen } from '@swiftshopr/sdk';

export default function MyScanAndGo({ navigation }) {
  return (
    <ScanAndGoScreen
      storeId="STORE_1234"
      storeName="Your Store - Location"
      primaryColor="#22C55E"              // Your brand color
      onComplete={(result) => {
        console.log('Payment complete:', result);
        // Update loyalty points, log purchase, etc.
        navigation.navigate('Home');
      }}
      onCancel={() => navigation.goBack()}
    />
  );
}
```

**That's it!** Your customers can now scan products and pay with USDC.

---

## ScanAndGoScreen Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `storeId` | `string` | Yes | Your store identifier |
| `storeName` | `string` | No | Display name (e.g., "Publix - Miami Beach") |
| `orderId` | `string` | No | Your order ID for correlation |
| `primaryColor` | `string` | No | Brand color (default: `#22C55E`) |
| `onComplete` | `function` | Yes | Called when checkout completes |
| `onCancel` | `function` | No | Called when user cancels |

### onComplete Callback

```jsx
onComplete={(result) => {
  // result object:
  {
    success: true,
    orderId: "ORDER-123",           // Your order ID (if provided)
    intentId: "PI_abc123",          // SwiftShopr payment intent
    txHash: "0x...",                // Blockchain transaction hash
    items: [                        // Purchased items
      { barcode: "012345678901", name: "Milk", price: 4.29, quantity: 1 },
      { barcode: "012345678902", name: "Bread", price: 3.49, quantity: 2 },
    ],
    total: 11.27,
    receipt: {
      receiptId: "RCP_xyz789",      // Receipt ID
      qrData: "swiftshopr://...",   // QR code data
      qrUrl: "https://..."          // QR code image URL
    }
  }
}}
```

---

## Customer Flow

```
1. Customer taps "Scan & Pay" in your app
          ↓
2. Camera opens, customer scans product barcodes
          ↓
3. Products added to cart with prices
          ↓
4. Customer reviews cart and taps "Pay with USDC"
          ↓
5. Payment processes on Base blockchain
          ↓
6. Receipt screen appears with verification code
          ↓
7. Customer shows receipt to any store employee
          ↓
8. Employee verifies code + timestamp
          ↓
9. Customer taps "Done" → onComplete fires
```

---

## Receipt & Verification

After payment, customers see a digital receipt with:

- **Verification Code** - 8-character code (e.g., `A7B3C9D2`)
- **Timestamp** - Date and time of purchase
- **Items List** - All purchased items with prices
- **Total Amount** - Total paid in USDC
- **Store Name** - Current store location

### Screenshot Protection

Receipts are **screenshot protected** to prevent fraud:
- **iOS**: Screenshots show a black screen
- **Android**: Screenshots are completely blocked (FLAG_SECURE)

This ensures customers must show the **live screen** to employees.

### Employee Verification (Visual)

Employees verify purchases by checking:
1. Verification code is visible (not a screenshot)
2. Timestamp is recent (within ~15 minutes)
3. Items match what customer is carrying

No special hardware or apps required.

---

## Individual Components

For more control, use individual SDK components:

### BarcodeScanner

```jsx
import { BarcodeScanner } from '@swiftshopr/sdk';

<BarcodeScanner
  onScan={(barcode, type) => handleScan(barcode)}
  enabled={true}
  primaryColor="#22C55E"
  instructionText="Scan product barcode"
/>
```

### PayWithUSDC Button

```jsx
import { PayWithUSDC } from '@swiftshopr/sdk';

<PayWithUSDC
  amountUsd={42.99}
  storeId="STORE_1234"
  orderId="ORDER-456"
  onSuccess={(result) => console.log('Paid!', result)}
  onError={(error) => console.log('Failed:', error)}
/>
```

### Cart Management

```jsx
import { useCart, CartProvider } from '@swiftshopr/sdk';

// Wrap component with CartProvider
<CartProvider storeId="STORE_1234">
  <MyComponent />
</CartProvider>

// Use the cart hook
function MyComponent() {
  const { items, total, addItem, removeItem, clear } = useCart();

  return (
    <View>
      <Text>Total: ${total.toFixed(2)}</Text>
      {items.map(item => (
        <Text key={item.barcode}>{item.name} x{item.quantity}</Text>
      ))}
    </View>
  );
}
```

---

## Core Functions

### Product Lookup

```jsx
import { lookupProduct } from '@swiftshopr/sdk';

const product = await lookupProduct({
  barcode: "012345678901",
  storeId: "STORE_1234",
  apiBaseUrl: "https://api.swiftshopr.com",
  apiKey: "pk_live_...",
});

// Returns:
{
  barcode: "012345678901",
  name: "Organic Milk 1 Gal",
  price: 5.99,
  image: "https://...",
  inStock: true
}
```

### Cart Validation

```jsx
import { validateCart } from '@swiftshopr/sdk';

const validation = await validateCart({
  items: cartItems,
  storeId: "STORE_1234",
  apiBaseUrl: "https://api.swiftshopr.com",
  apiKey: "pk_live_...",
});

// Returns:
{
  valid: true,
  subtotal: 42.99,
  priceChanges: [],        // Any price changes since scan
  unavailableItems: []     // Items no longer in stock
}
```

### Receipt Generation

```jsx
import { generateReceipt, getReceipt } from '@swiftshopr/sdk';

// Generate after payment
const receipt = await generateReceipt({
  intentId: "PI_abc123",
  storeId: "STORE_1234",
  items: cartItems,
  total: 42.99,
  apiBaseUrl: "https://api.swiftshopr.com",
  apiKey: "pk_live_...",
});

// Fetch existing receipt
const existing = await getReceipt({
  receiptId: "RCP_xyz789",
  apiBaseUrl: "https://api.swiftshopr.com",
  apiKey: "pk_live_...",
});
```

---

## Backend Integration

### Product Catalog Sync

Sync your product catalog with SwiftShopr:

```bash
POST https://api.swiftshopr.com/v1/retailers/products/sync
Authorization: Bearer sk_live_your_secret_key
Content-Type: application/json

{
  "store_id": "STORE_1234",
  "products": [
    {
      "barcode": "012345678901",
      "name": "Organic Milk 1 Gal",
      "price": 5.99,
      "category": "Dairy",
      "image_url": "https://...",
      "in_stock": true
    },
    ...
  ]
}
```

**Sync Options:**
- **Nightly batch sync** - Full catalog update
- **Webhook on change** - Real-time price/stock updates
- **On-demand API** - Query your POS for each scan

### Payment Webhooks

Receive notifications when payments complete:

```bash
POST https://your-server.com/webhooks/swiftshopr
Content-Type: application/json
X-SwiftShopr-Signature: sha256=...

{
  "event": "payment.completed",
  "intent_id": "PI_abc123",
  "store_id": "STORE_1234",
  "order_id": "ORDER-456",
  "amount": 42.99,
  "tx_hash": "0x...",
  "receipt_id": "RCP_xyz789",
  "items": [...],
  "timestamp": "2025-12-23T15:30:00Z"
}
```

---

## Pricing

| Payment Method | Fee | Settlement |
|----------------|-----|------------|
| Credit Card | 2.5-3.5% | 2-3 days |
| **SwiftShopr USDC** | **0.3%** | **Instant** |

**Example: $100 transaction**
- Credit card fee: ~$3.00
- SwiftShopr fee: $0.30
- **You save: $2.70 per transaction**

No chargebacks. No disputes. Instant settlement to your wallet.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     YOUR RETAIL APP                          │
│                                                              │
│  ┌──────────────────────────────────────────────────┐       │
│  │              @swiftshopr/sdk                      │       │
│  │                                                   │       │
│  │  Components:        Hooks:          Core:         │       │
│  │  • ScanAndGoScreen  • useCart       • lookupProduct│      │
│  │  • BarcodeScanner   • usePayment    • validateCart │      │
│  │  • PayWithUSDC      • useWallet     • generateReceipt│    │
│  │  • CartProvider                     • getPaymentStatus│   │
│  │                                                   │       │
│  └──────────────────────────────────────────────────┘       │
│                          ↓                                   │
└─────────────────────────────────────────────────────────────┘
                           ↓
              SwiftShopr Backend API
                           ↓
         ┌─────────────────────────────────┐
         │     Base Blockchain (L2)        │
         │     USDC Payments               │
         └─────────────────────────────────┘
```

---

## Security Features

| Feature | Description |
|---------|-------------|
| Screenshot Protection | Receipts cannot be screenshotted |
| Verification Codes | Unique codes per transaction |
| Timestamp Validation | Receipts expire after ~15 minutes |
| API Key Authentication | Secure retailer identification |
| Blockchain Verification | Immutable transaction records |

---

## Support

- **Email**: sdk-support@swiftshopr.com
- **Documentation**: https://docs.swiftshopr.com
- **API Status**: https://status.swiftshopr.com

---

## Example: Complete Integration (Publix)

```jsx
// App.js
import { SwiftShoprProvider } from '@swiftshopr/sdk';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import ScanAndGoScreen from './screens/ScanAndGoScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SwiftShoprProvider
      apiKey="pk_live_publix_abc123"
      apiBaseUrl="https://api.swiftshopr.com"
    >
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen
            name="ScanAndGo"
            component={ScanAndGoScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SwiftShoprProvider>
  );
}

// screens/ScanAndGoScreen.js
import { ScanAndGoScreen } from '@swiftshopr/sdk';

export default function PublixScanAndGo({ navigation }) {
  const handleComplete = async (result) => {
    // Update Publix loyalty points
    await updateLoyaltyPoints(result.total);

    // Log purchase to analytics
    analytics.logPurchase(result);

    // Return to home
    navigation.navigate('Home');
  };

  return (
    <ScanAndGoScreen
      storeId="PUBLIX_MIAMI_001"
      storeName="Publix - Miami Beach"
      primaryColor="#378B29"
      onComplete={handleComplete}
      onCancel={() => navigation.goBack()}
    />
  );
}
```

**Total engineering effort: ~1-2 days**

---

*SwiftShopr SDK v1.0.0*
