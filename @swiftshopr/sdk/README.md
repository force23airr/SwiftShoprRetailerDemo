# @swiftshopr/sdk

> White-label USDC payments and Scan & Go checkout for retail mobile apps.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/swiftshopr/sdk)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)

**Add crypto payments to your retail app in 3 hours.**

- 🛒 **Complete Scan & Go** - Barcode scanner, cart, checkout, receipt
- 💰 **USDC Payments** - 0.3% fees (vs 2.5-3.5% credit cards)
- ⚡ **Instant Settlement** - Money in your wallet immediately
- 🚫 **No Chargebacks** - Blockchain-based, irreversible
- 📱 **White-Label** - Fully customizable to your brand
- 🔒 **Secure** - Screenshot-protected receipts, exit verification

---

## Quick Start

### Installation

```bash
npm install @swiftshopr/sdk expo-camera expo-screen-capture
```

### Wrap Your App

```jsx
// App.js
import { SwiftShoprProvider } from '@swiftshopr/sdk';

export default function App() {
  return (
    <SwiftShoprProvider
      apiKey="pk_live_your_api_key"
      apiBaseUrl="https://api.swiftshopr.com"
    >
      <YourApp />
    </SwiftShoprProvider>
  );
}
```

### Add Scan & Go

```jsx
// screens/ScanAndGoScreen.js
import { ScanAndGoScreen } from '@swiftshopr/sdk';

export default function MyScanAndGo({ navigation }) {
  return (
    <ScanAndGoScreen
      storeId="STORE_1234"
      storeName="Your Store - Location"
      primaryColor="#22C55E"
      onComplete={(result) => {
        console.log('Payment complete!', result);
        navigation.navigate('Home');
      }}
      onCancel={() => navigation.goBack()}
    />
  );
}
```

**That's it.** Your customers can now scan products and pay with USDC.

---

## Authentication

Get your API credentials from the [SwiftShopr Dashboard](https://dashboard.swiftshopr.com):

```jsx
<SwiftShoprProvider
  apiKey="pk_live_abc123..."        // Your public API key
  apiBaseUrl="https://api.swiftshopr.com"
/>
```

**Test Mode:**
```jsx
apiKey="pk_test_xyz789..."          // Use test key for development
```

---

## Features

### 🎯 Drop-In Components

| Component | Purpose |
|-----------|---------|
| `ScanAndGoScreen` | Complete checkout flow (scan → cart → pay → receipt) |
| `BarcodeScanner` | Camera-based product scanning |
| `PayWithUSDC` | Payment button |
| `OnrampModal` | Add funds via Coinbase |

### 🎣 React Hooks

| Hook | Returns |
|------|---------|
| `useCart()` | Cart state, add/remove items |
| `usePayment()` | Process USDC payments |
| `useSwiftShoprWallet()` | Wallet address, balance |

### ⚙️ Core Functions

| Function | Purpose |
|----------|---------|
| `lookupProduct()` | Get product details by barcode |
| `validateCart()` | Verify prices before checkout |
| `generateReceipt()` | Create digital receipt |
| `getPaymentStatus()` | Track payment progress |

---

## Example: Complete Integration

```jsx
import {
  SwiftShoprProvider,
  ScanAndGoScreen,
  useCart,
  PayWithUSDC
} from '@swiftshopr/sdk';

// 1. Wrap your app
export default function App() {
  return (
    <SwiftShoprProvider apiKey="pk_live_..." apiBaseUrl="https://api.swiftshopr.com">
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="ScanAndGo" component={ScanAndGoScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SwiftShoprProvider>
  );
}

// 2. Launch from your home screen
function HomeScreen({ navigation }) {
  return (
    <TouchableOpacity onPress={() => navigation.navigate('ScanAndGo')}>
      <Text>Scan & Pay</Text>
    </TouchableOpacity>
  );
}

// 3. Complete checkout experience
function ScanAndGoScreen({ navigation }) {
  return (
    <ScanAndGoScreen
      storeId="PUBLIX_001"
      storeName="Publix - Miami Beach"
      primaryColor="#378B29"
      onComplete={(result) => {
        // result = { orderId, intentId, txHash, items, total, receipt }
        console.log('Paid:', result.total);
        navigation.navigate('Home');
      }}
    />
  );
}
```

---

## Payment Flow

```
Customer opens app
       ↓
Taps "Scan & Pay"
       ↓
Scans product barcodes
       ↓
Reviews cart
       ↓
Taps "Pay with USDC"
       ↓
Payment processes on Base blockchain
       ↓
Receipt appears (screenshot protected)
       ↓
Shows receipt to employee
       ↓
Employee verifies → Done
```

---

## Receipt & Verification

After payment, customers see a digital receipt with:

- **Verification Code** (e.g., `A7B3C9D2`)
- **Timestamp** (proves freshness)
- **Items List** (all purchased products)
- **Total Amount** (paid in USDC)

### Screenshot Protection

Receipts are **screenshot protected**:
- iOS: Screenshots show black screen
- Android: Screenshots completely blocked

This prevents receipt fraud and ensures customers show the **live screen** to employees.

### Visual Verification

Employees verify by checking:
1. Code is visible (not a screenshot)
2. Timestamp is recent (~15 mins)
3. Items match what customer is carrying

No special hardware needed.

---

## Pricing

| Payment Method | Fee | Settlement |
|----------------|-----|------------|
| Credit Card | 2.5-3.5% | 2-3 days |
| **SwiftShopr** | **0.3%** | **Instant** |

**Example: $100 transaction**
- Credit card fee: ~$3.00
- SwiftShopr fee: $0.30
- **You save: $2.70**

---

## Documentation

- 📘 [Integration Guide](./INTEGRATION_GUIDE.md) - Complete retailer integration
- 📗 [API Reference](./API_REFERENCE.md) - Endpoint documentation
- 📙 [Component Docs](./docs/components.md) - Component API reference
- 📕 [Examples](./examples/) - Code examples

---

## Requirements

- React Native >= 0.72.0
- Expo SDK >= 50.0.0
- iOS >= 13.0
- Android >= 7.0 (API 24)

---

## Support

- **Email**: sdk-support@swiftshopr.com
- **Documentation**: https://docs.swiftshopr.com
- **Dashboard**: https://dashboard.swiftshopr.com
- **Status**: https://status.swiftshopr.com

---

## License

Proprietary - © 2025 SwiftShopr Inc.

Contact sales@swiftshopr.com for licensing.
